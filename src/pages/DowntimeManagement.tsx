import React, { useState, useRef, useMemo } from "react";
import { useData } from "../context/DataContext";
import DataTable from "../components/DataTable";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { toZonedTime, fromZonedTime, formatInTimeZone } from "date-fns-tz";
import { FilterMatchMode } from "primereact/api";
import type { DataTableFilterMeta } from "primereact/datatable";
import type { Downtime } from "../types";
import { validateDowntime, type ValidationErrors } from "../utils/validate";

const TIMEZONES = [
  { label: "UTC (Coordinated Universal Time)", value: "UTC" },
  { label: "EST (New York, Toronto)", value: "America/New_York" },
  { label: "CST (Chicago, Mexico City)", value: "America/Chicago" },
  { label: "PST (Los Angeles, Vancouver)", value: "America/Los_Angeles" },
  { label: "GMT/BST (London)", value: "Europe/London" },
  { label: "CET (Paris, Berlin)", value: "Europe/Paris" },
  { label: "IST (India)", value: "Asia/Kolkata" },
  { label: "SGT (Singapore)", value: "Asia/Singapore" },
  { label: "JST (Tokyo)", value: "Asia/Tokyo" },
  { label: "AEST (Sydney)", value: "Australia/Sydney" },
];

const DowntimeManagement: React.FC = () => {
  const {
    applications,
    downtimes,
    addDowntime,
    updateDowntime,
    deleteDowntime,
    loading,
  } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDt, setEditingDt] = useState<Downtime | null>(null);
  const [formData, setFormData] = useState({
    applicationId: "",
    startTime: null as Date | null,
    endTime: null as Date | null,
    timezone: "UTC",
  });
  const [errors, setErrors] = useState<ValidationErrors>({});

  // Delete confirmation state
  const [deleteDt, setDeleteDt] = useState<Downtime | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const toast = useRef<Toast>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [filters, setFilters] = useState<DataTableFilterMeta>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    status: { value: null, matchMode: FilterMatchMode.EQUALS },
  });

  const [tick, setTick] = useState(0);

  // Auto-refresh status every 60 seconds
  React.useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const enrichedDowntimes = useMemo(() => {
    const now = new Date();
    // Use tick to force re-calculation
    if (tick < 0) void tick;

    return downtimes.map((dt) => {
      const start = new Date(dt.startTime);
      const end = new Date(dt.endTime);
      let status = "";
      if (now < start) status = "Planned";
      else if (now > end) status = "Completed";
      else status = "In Progress";
      return { ...dt, status };
    });
  }, [downtimes, tick]);

  const handleOpenModal = (dt?: Downtime) => {
    if (dt) {
      setEditingDt(dt);
      const tz = dt.timezone || "UTC";
      setFormData({
        applicationId: dt.applicationId,
        startTime: toZonedTime(dt.startTime, tz),
        endTime: toZonedTime(dt.endTime, tz),
        timezone: tz,
      });
    } else {
      setEditingDt(null);
      setFormData({
        applicationId: applications[0]?.id || "",
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        timezone: "UTC",
      });
    }
    setErrors({});
    setIsModalOpen(true);
  };

  const confirmDelete = (dt: Downtime) => {
    setDeleteDt(dt);
  };

  const executeDelete = async () => {
    if (!deleteDt) return;
    setIsDeleting(true);
    try {
      await deleteDowntime(deleteDt.id, deleteDt.applicationId);
      setDeleteDt(null);
      toast.current?.show({
        severity: "success",
        summary: "Successful",
        detail: "Downtime Record Deleted",
        life: 3000,
      });
    } catch (error) {
      console.error("Failed to delete downtime", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to delete downtime record",
        life: 3000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteFooter = (
    <div className="flex justify-content-end gap-2">
      <Button
        label="No"
        icon="pi pi-times"
        className="p-button-text p-button-secondary"
        onClick={() => setDeleteDt(null)}
        disabled={isDeleting}
      />
      <Button
        label="Yes"
        icon="pi pi-check"
        className="p-button-danger"
        onClick={executeDelete}
        loading={isDeleting}
        autoFocus
      />
    </div>
  );

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const validationErrors = validateDowntime(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const application = applications.find(
        (a) => a.id === formData.applicationId
      );
      const data = {
        applicationId: formData.applicationId,
        applicationName: application?.name || "",
        startTime: fromZonedTime(
          formData.startTime!,
          formData.timezone
        ).toISOString(),
        endTime: fromZonedTime(
          formData.endTime!,
          formData.timezone
        ).toISOString(),
        timezone: formData.timezone,
        id: editingDt?.id || Date.now().toString(),
      };

      if (editingDt) {
        await updateDowntime(data as Downtime);
      } else {
        await addDowntime(data as Downtime);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to save downtime", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const footer = (
    <div className="flex justify-content-end gap-2">
      <Button
        label="Cancel"
        onClick={() => setIsModalOpen(false)}
        className="p-button-text p-button-secondary font-medium"
        style={{ color: "#64748b" }}
      />
      <Button
        label={editingDt ? "Save Changes" : "Schedule Downtime"}
        onClick={() => handleSubmit()}
        loading={isSubmitting}
        className="font-medium"
        style={{ backgroundColor: "#4F46E5", borderColor: "#4F46E5" }}
        autoFocus
      />
    </div>
  );

  const getStatusBadge = (dt: Downtime) => {
    const now = new Date();
    const start = new Date(dt.startTime);
    const end = new Date(dt.endTime);

    if (now < start) {
      return (
        <span
          className="inline-block px-2 py-1 border-round font-medium text-xs status-badge"
          style={{ backgroundColor: "#DBEAFE", color: "#1E40AF" }}
        >
          Planned
        </span>
      );
    } else if (now > end) {
      return (
        <span
          className="inline-block px-2 py-1 border-round font-medium text-xs status-badge"
          style={{ backgroundColor: "#DCFCE7", color: "#166534" }}
        >
          Completed
        </span>
      );
    } else {
      return (
        <span
          className="inline-block px-2 py-1 border-round font-medium text-xs status-badge"
          style={{ backgroundColor: "#FEF3C7", color: "#92400E" }}
        >
          In Progress
        </span>
      );
    }
  };

  return (
    <div className="management-page fade-in">
      <Toast ref={toast} />
      <header className="page-header mb-4">
        <div>
          <p className="text-color-secondary mt-0">
            Schedule and track system downtime periods across all applications.
          </p>
        </div>
      </header>

      <DataTable
        title="Downtime Records"
        data={enrichedDowntimes}
        onAdd={() => handleOpenModal()}
        loading={loading}
        filters={filters}
        onFilterChange={setFilters}
        headerExtra={
          <Dropdown
            value={(filters.status as any)?.value}
            options={[
              { label: "Planned", value: "Planned" },
              { label: "In Progress", value: "In Progress" },
              { label: "Completed", value: "Completed" },
            ]}
            onChange={(e) => {
              const _filters = { ...filters };
              (_filters["status"] as any).value = e.value;
              setFilters(_filters);
            }}
            placeholder="All Status"
            className="p-inputtext-sm w-full md:w-12rem"
            showClear
          />
        }
        columns={[
          {
            header: "Application",
            field: "applicationName",
            sortable: true,
            headerStyle: { width: "25%" },
          },

          {
            header: "Start Time",
            body: (dt: Downtime) => (
              <span className="inline-block px-2 py-1 border-round surface-200 text-900 font-medium">
                {formatInTimeZone(
                  dt.startTime,
                  dt.timezone || "UTC",
                  "MMM d, yyyy, HH:mm"
                )}
              </span>
            ),
            field: "startTime",
            sortable: true,
            headerStyle: { width: "20%" },
          },
          {
            header: "End Time",
            body: (dt: Downtime) => (
              <span className="inline-block px-2 py-1 border-round surface-200 text-900 font-medium">
                {formatInTimeZone(
                  dt.endTime,
                  dt.timezone || "UTC",
                  "MMM d, yyyy, HH:mm"
                )}
              </span>
            ),
            field: "endTime",
            sortable: true,
            headerStyle: { width: "20%" },
          },
          {
            header: "Timezone",
            body: (dt: Downtime) => (
              <span className="text-sm font-medium text-600 bg-gray-100 px-2 py-1 border-round">
                {dt.timezone || "UTC"}
              </span>
            ),
            field: "timezone",
            sortable: true,
            headerStyle: { width: "12%" },
          },
          {
            header: "Status",
            field: "status",
            body: (dt: any) => getStatusBadge(dt),
            sortable: true,
            headerStyle: { width: "150px" },
          },
          {
            header: "Actions",
            body: (dt: Downtime) => (
              <div className="flex gap-2">
                <button
                  className="action-btn edit-btn"
                  onClick={() => handleOpenModal(dt)}
                >
                  Edit
                </button>
                <button
                  className="action-btn delete-btn"
                  onClick={() => confirmDelete(dt)}
                >
                  Delete
                </button>
              </div>
            ),
            headerStyle: { width: "130px" },
          },
        ]}
      />

      {/* Edit/Create Modal */}
      <Dialog
        header={editingDt ? "Edit Downtime" : "Schedule New Downtime"}
        visible={isModalOpen}
        style={{ width: "550px" }}
        breakpoints={{ "960px": "75vw", "641px": "90vw" }}
        footer={footer}
        onHide={() => !isSubmitting && setIsModalOpen(false)}
      >
        <div className="p-fluid">
          <div className="field mb-4">
            <label
              htmlFor="appSelect"
              className="block mb-2 text-900"
            >
              Target Application
            </label>
            <Dropdown
              id="appSelect"
              value={formData.applicationId}
              options={applications}
              optionLabel="name"
              optionValue="id"
              onChange={(e) => {
                setFormData({ ...formData, applicationId: e.value });
                if (errors.applicationId) setErrors({ ...errors, applicationId: "" });
              }}
              placeholder="Select an Application"
              className={`w-full ${errors.applicationId ? "p-invalid" : ""}`}
            />
            {errors.applicationId && <small className="error-msg">{errors.applicationId}</small>}
          </div>
          <div className="field  mb-4">
            <label
              htmlFor="timezone"
              className="block mb-2 text-900"
            >
              Timezone
            </label>
            <Dropdown
              id="timezone"
              value={formData.timezone}
              options={TIMEZONES}
              onChange={(e) => setFormData({ ...formData, timezone: e.value })}
              placeholder="Select Zone"
              className="w-full"
              filter
            />
          </div>

          <div className="field mb-4">
            <label
              htmlFor="startTime"
              className=" block mb-2 text-900"
            >
              Start Period
            </label>
            <Calendar
              id="startTime"
              value={formData.startTime}
              onChange={(e) => {
                const newStart = e.value as Date | null;
                setFormData((prev) => {
                  let newEnd = prev.endTime;
                  if (newStart && newEnd && newStart > newEnd) {
                    newEnd = new Date(newStart.getTime() + 3600000); // Default 1 hour later
                  }
                  return { ...prev, startTime: newStart, endTime: newEnd };
                });
                if (errors.startTime) setErrors({ ...errors, startTime: "" });
              }}
              showTime
              hourFormat="24"
              placeholder="Select start date & time"
              className={`w-full ${errors.startTime ? "p-invalid" : ""}`}
            />
            {errors.startTime && <small className="error-msg">{errors.startTime}</small>}
          </div>

          <div className="field">
            <label
              htmlFor="endTime"
              className="block mb-2 text-900"
            >
              End Period
            </label>
            <Calendar
              id="endTime"
              value={formData.endTime}
              onChange={(e) => {
                setFormData({ ...formData, endTime: e.value as Date | null });
                if (errors.endTime) setErrors({ ...errors, endTime: "" });
              }}
              minDate={formData.startTime || undefined}
              showTime
              hourFormat="24"
              placeholder="Select end date & time"
              className={`w-full ${errors.endTime ? "p-invalid" : ""}`}
            />
            {errors.endTime && <small className="error-msg">{errors.endTime}</small>}
          </div>
        </div>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        visible={!!deleteDt}
        style={{ width: "450px" }}
        header="Confirm Delete"
        modal
        footer={deleteFooter}
        onHide={() => !isDeleting && setDeleteDt(null)}
      >
        <div className="flex align-items-center">
          <i
            className="pi pi-exclamation-triangle mr-3"
            style={{ fontSize: "2rem", color: "#ef4444" }}
          />
          <span>Are you sure you want to delete this downtime record?</span>
        </div>
      </Dialog>
    </div>
  );
};

export default DowntimeManagement;
