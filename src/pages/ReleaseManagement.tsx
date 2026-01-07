import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useData } from "../context/DataContext";
import DataTable from "../components/DataTable";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Calendar } from "primereact/calendar";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { toZonedTime, fromZonedTime, formatInTimeZone } from "date-fns-tz";
import type { Release } from "../types";
import { validateRelease, type ValidationErrors } from "../utils/validate";

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

const ReleaseManagement: React.FC = () => {
    const { applications, releases, addRelease, updateRelease, deleteRelease, loading } =
        useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRel, setEditingRel] = useState<Release | null>(null);
    const [formData, setFormData] = useState({
        applicationId: "",
        version: "",
        releaseDate: null as Date | null,
        timezone: "UTC",
        details: "",
    });
    const [errors, setErrors] = useState<ValidationErrors>({});

    // Delete confirmation state
    const [deleteRel, setDeleteRel] = useState<Release | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const toast = useRef<Toast>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleOpenModal = (rel?: Release) => {
        if (rel) {
            setEditingRel(rel);
            // Convert stored UTC ISO string to the stored timezone (or UTC if none)
            // This ensures the Calendar shows the correct "wall clock" time for that zone
            const tz = rel.timezone || "UTC";
            const zonedDate = toZonedTime(rel.releaseDate, tz);

            setFormData({
                applicationId: rel.applicationId,
                version: rel.version,
                releaseDate: zonedDate,
                timezone: tz,
                details: rel.details || "",
            });
        } else {
            setEditingRel(null);

            setFormData({
                applicationId: applications[0]?.id || "",
                version: "",
                releaseDate: new Date(),
                timezone: "UTC",
                details: "",
            });
        }
        setErrors({});
        setIsModalOpen(true);
    };

    const confirmDelete = (rel: Release) => {
        setDeleteRel(rel);
    };

    const executeDelete = async () => {
        if (!deleteRel) return;
        setIsDeleting(true);
        try {
            await deleteRelease(deleteRel.id, deleteRel.applicationId);
            setDeleteRel(null);
            toast.current?.show({
                severity: "success",
                summary: "Successful",
                detail: "Release Deleted",
                life: 3000,
            });
        } catch (error) {
            console.error("Failed to delete release", error);
            toast.current?.show({
                severity: "error",
                summary: "Error",
                detail: "Failed to delete release",
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
                onClick={() => setDeleteRel(null)}
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

        const validationErrors = validateRelease(formData);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setIsSubmitting(true);
        try {
            const application = applications.find(
                (a) => a.id === formData.applicationId
            );

            // Convert the "wall clock" time from the form + selected timezone -> UTC ISO String
            const utcDate = fromZonedTime(formData.releaseDate!, formData.timezone);

            const data = {
                applicationId: formData.applicationId,
                applicationName: application?.name || "",
                version: formData.version,
                releaseDate: utcDate.toISOString(),
                timezone: formData.timezone,
                details: formData.details,
                id: editingRel?.id || "temp-id",
            };

            if (editingRel) {
                await updateRelease(data as Release);
            } else {
                await addRelease(data as Release);
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error("Failed to save release", error);
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
                label={editingRel ? "Save Changes" : "Deploy Release"}
                onClick={() => handleSubmit()}
                loading={isSubmitting}
                className="font-medium"
                style={{ backgroundColor: "#4F46E5", borderColor: "#4F46E5" }}
                autoFocus
            />
        </div>
    );

    return (
        <div className="management-page fade-in">
            <Toast ref={toast} />
            <header className="page-header mb-4">
                <div>
                    {/* <h1 className="text-3xl font-bold mb-2">Release Management</h1> */}
                    <p className="text-color-secondary mt-0">
                        Track and publish new software releases across your infrastructure.
                    </p>
                </div>
            </header>

            <DataTable
                title="Releases"
                data={[...releases].sort(
                    (a, b) =>
                        new Date(b.releaseDate).getTime() -
                        new Date(a.releaseDate).getTime()
                )}
                onAdd={() => handleOpenModal()}
                loading={loading}
                columns={[
                    { header: "Application", field: "applicationName", sortable: true },
                    {
                        header: "Version",
                        body: (rel: Release) => (
                            <span className="inline-block px-2 py-1 border-round surface-200 text-900 font-medium">
                                {rel.version}
                            </span>
                        ),
                        field: "version",
                        sortable: true,
                    },
                    {
                        header: "Release Date",
                        body: (rel: Release) => {
                            // Display time in the release's stored timezone
                            return (
                                <span className="inline-block px-2 py-1 border-round surface-200 text-900 font-medium">
                                    {formatInTimeZone(
                                        rel.releaseDate,
                                        rel.timezone || "UTC",
                                        "MMM d, yyyy, HH:mm"
                                    )}
                                </span>
                            );
                        },
                        field: "releaseDate",
                        sortable: true,
                    },
                    {
                        header: "Timezone",
                        body: (rel: Release) => (
                            <span className="text-sm font-medium text-600 bg-gray-100 px-2 py-1 border-round">
                                {rel.timezone || "UTC"}
                            </span>
                        ),
                        field: "timezone",
                        sortable: true,
                    },
                    {
                        header: "Actions",
                        body: (rel: Release) => (
                            <div className="flex gap-2 align-items-center">
                                <Link
                                    to={`/release/${rel.id}`}
                                    className="action-btn view-btn"
                                >
                                    View
                                </Link>
                                <button
                                    className="action-btn edit-btn"
                                    onClick={() => handleOpenModal(rel)}
                                >
                                    Edit
                                </button>
                                <button
                                    className="action-btn delete-btn"
                                    onClick={() => confirmDelete(rel)}
                                >
                                    Delete
                                </button>
                            </div>
                        ),
                    },
                ]}
            />

            {/* Edit/Create Modal */}
            <Dialog
                header={editingRel ? "Edit Release" : "Deploy New Release"}
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
                            className=" block mb-2 text-900"
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
                    <div className="field mb-4">
                        <label
                            htmlFor="version"
                            className=" block mb-2 text-900"
                        >
                            Version Number
                        </label>
                        <InputText
                            id="version"
                            value={formData.version}
                            onChange={(e) => {
                                setFormData({ ...formData, version: e.target.value });
                                if (errors.version) setErrors({ ...errors, version: "" });
                            }}
                            placeholder="e.g. v2.0.1"
                            className={`w-full ${errors.version ? "p-invalid" : ""}`}
                        />
                        {errors.version && <small className="error-msg">{errors.version}</small>}
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
                            htmlFor="releaseDate"
                            className="block mb-2 text-900"
                        >
                            Release Date & Time
                        </label>
                        <Calendar
                            id="releaseDate"
                            value={formData.releaseDate}
                            onChange={(e) => {
                                setFormData({
                                    ...formData,
                                    releaseDate: e.value as Date | null,
                                });
                                if (errors.releaseDate) setErrors({ ...errors, releaseDate: "" });
                            }}
                            showTime
                            hourFormat="24"
                            inputClassName="w-full"
                            placeholder="Select date & time"
                            className={`w-full ${errors.releaseDate ? "p-invalid" : ""}`}
                        />
                        {errors.releaseDate && <small className="error-msg">{errors.releaseDate}</small>}
                    </div>

                    <div className="field mb-4">
                        <label
                            htmlFor="details"
                            className="block mb-2 text-900"
                        >
                            Release Details
                        </label>
                        <InputTextarea
                            id="details"
                            value={formData.details}
                            onChange={(e) =>
                                setFormData({ ...formData, details: e.target.value })
                            }
                            rows={4}
                            autoResize
                            placeholder="Highlights and changelog notes..."
                            className="w-full"
                        />
                    </div>
                </div>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog
                visible={!!deleteRel}
                style={{ width: "450px" }}
                header="Confirm Delete"
                modal
                footer={deleteFooter}
                onHide={() => !isDeleting && setDeleteRel(null)}
            >
                <div className="flex align-items-center">
                    <i
                        className="pi pi-exclamation-triangle mr-3"
                        style={{ fontSize: "2rem", color: "#ef4444" }}
                    />
                    <span>Are you sure you want to delete this release?</span>
                </div>
            </Dialog>
        </div>
    );
};

export default ReleaseManagement;
