import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { useData } from "../context/DataContext";
import SummaryCard from "../components/SummaryCard";
import DataTable from "../components/DataTable";
import { parseISO, startOfDay, endOfDay } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { TabView, TabPanel } from "primereact/tabview";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputText } from "primereact/inputtext";
import type { Downtime, Release } from "../types";
import "./Dashboard.scss";

const Dashboard: React.FC = () => {
  const { applications, downtimes, releases, loading, error } = useData();

  // --- State for Release Tab ---
  const [relAppFilter, setRelAppFilter] = useState<string>("");
  const [relFromDate, setRelFromDate] = useState<Date | null>(null);
  const [relToDate, setRelToDate] = useState<Date | null>(null);
  const [relVersionFilter, setRelVersionFilter] = useState("");

  // --- State for Downtime Tab ---
  const [dtAppFilter, setDtAppFilter] = useState<string>("");
  const [dtFromDate, setDtFromDate] = useState<Date | null>(null);
  const [dtToDate, setDtToDate] = useState<Date | null>(null);
  const [dtStatusFilter, setDtStatusFilter] = useState<string>("");

  // --- Filtering Logic ---
  const filteredReleases = useMemo(() => {
    return releases.filter((rel) => {
      const matchesApp = !relAppFilter || rel.applicationId === relAppFilter;
      const relDate = parseISO(rel.releaseDate);
      const matchesDate =
        (!relFromDate || relDate >= startOfDay(relFromDate)) &&
        (!relToDate || relDate <= endOfDay(relToDate));
      const matchesVersion =
        !relVersionFilter ||
        rel.version.toLowerCase().includes(relVersionFilter.toLowerCase());
      return matchesApp && matchesDate && matchesVersion;
    });
  }, [releases, relAppFilter, relFromDate, relToDate, relVersionFilter]);

  // Timer for auto-refresh
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const filteredDowntimes = useMemo(() => {
    const now = new Date();
    // Use tick to force re-calc logic
    if (tick < 0) void tick;

    return downtimes.filter((dt) => {
      const matchesApp = !dtAppFilter || dt.applicationId === dtAppFilter;
      const dtStart = parseISO(dt.startTime);
      const matchesDate =
        (!dtFromDate || dtStart >= startOfDay(dtFromDate)) &&
        (!dtToDate || dtStart <= endOfDay(dtToDate));

      // Status logic for top-level filter
      const start = new Date(dt.startTime);
      const end = new Date(dt.endTime);
      let status = "";
      if (now < start) status = "Planned";
      else if (now > end) status = "Completed";
      else status = "In Progress";

      const matchesStatus = !dtStatusFilter || status === dtStatusFilter;

      return matchesApp && matchesDate && matchesStatus;
    });
  }, [downtimes, dtAppFilter, dtFromDate, dtToDate, dtStatusFilter, tick]);

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

  // --- Reset Handlers ---
  const resetRelFilters = () => {
    setRelAppFilter("");
    setRelFromDate(null);
    setRelToDate(null);
    setRelVersionFilter("");
  };

  const resetDtFilters = () => {
    setDtAppFilter("");
    setDtFromDate(null);
    setDtToDate(null);
    setDtStatusFilter("");
  };

  const appOptions = applications.map((app) => ({
    label: app.name,
    value: app.id,
  }));

  if (error)
    return (
      <div className="state-container error">
        <div className="error-icon">⚠️</div>
        <p>{error}</p>
      </div>
    );

  return (
    <div className="dashboard-container fade-in">
      {/* Summary Cards */}
      <div className="dashboard-grid">
        <SummaryCard
          title="Total Applications"
          value={applications.length}
          icon="📱"
          colorClass="primary"
          loading={loading}
        />
        <SummaryCard
          title="Active Downtimes"
          value={filteredDowntimes.length}
          icon="⚠️"
          colorClass="warning"
          loading={loading}
        />
        <SummaryCard
          title="Recent Releases"
          value={filteredReleases.length}
          icon="🚀"
          colorClass="success"
          loading={loading}
        />
      </div>

      {/* Main Content Areas with Tabs */}
      <div className="card">
        <TabView className="dashboard-tabs">
          {/* Tab 1: Upcoming Releases */}
          <TabPanel header="Upcoming Releases" leftIcon="pi pi-tag mr-2">
            {/* Filters */}
            {/* Filters */}
            <div className="grid p-fluid mb-4">
              <div className="col-12 md:col-6 lg:col-3">
                <label className="block text-sm font-medium mb-1">
                  Application
                </label>
                <Dropdown
                  value={relAppFilter}
                  options={appOptions}
                  onChange={(e) => setRelAppFilter(e.value)}
                  placeholder="All Systems"
                  className="w-full p-inputtext-sm dashboard-filter-height"
                  showClear
                />
              </div>
              <div className="col-12 md:col-6 lg:col-3">
                <label className="block text-sm font-medium mb-1">
                  From Date
                </label>
                <Calendar
                  value={relFromDate}
                  onChange={(e) => setRelFromDate(e.value ?? null)}
                  placeholder="mm/dd/yyyy"
                  className="w-full p-inputtext-sm dashboard-filter-height"
                  showIcon
                />
              </div>
              <div className="col-12 md:col-6 lg:col-3">
                <label className="block text-sm font-medium mb-1">
                  To Date
                </label>
                <Calendar
                  value={relToDate}
                  onChange={(e) => setRelToDate(e.value ?? null)}
                  placeholder="mm/dd/yyyy"
                  className="w-full p-inputtext-sm dashboard-filter-height"
                  showIcon
                  minDate={relFromDate || undefined}
                />
              </div>
              <div className="col-12 md:col-6 lg:col-3">
                <label className="block text-sm font-medium mb-1">
                  Version
                </label>
                <div className="flex gap-2">
                  <InputText
                    value={relVersionFilter}
                    onChange={(e) => setRelVersionFilter(e.target.value)}
                    placeholder="e.g. v1.2"
                    className="w-full p-inputtext-sm dashboard-filter-height"
                  />
                  <Button
                    icon="pi pi-filter-slash"
                    className="p-button-outlined p-button-secondary dashboard-filter-height"
                    onClick={resetRelFilters}
                    tooltip="Clear Filters"
                    tooltipOptions={{ position: "top" }}
                  />
                </div>
              </div>
            </div>

            {/* Table */}
            <DataTable
              title="Releases"
              data={filteredReleases}
              loading={loading}
              columns={[
                {
                  header: "Application",
                  field: "applicationName",
                  sortable: true,
                },
                {
                  header: "Version",
                  body: (rel: Release) => (
                    <span className="version-tag">{rel.version}</span>
                  ),
                  field: "version",
                  sortable: true,
                },
                {
                  header: "Release Date",
                  body: (rel: Release) => (
                    <span className="inline-block px-2 py-1 border-round surface-200 text-900 font-medium">
                      {formatInTimeZone(
                        rel.releaseDate,
                        rel.timezone || "UTC",
                        "MMM d, yyyy, HH:mm"
                      )}
                    </span>
                  ),
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
                  header: "Action",
                  body: (rel: Release) => (
                    <Link
                      to={`/release/${rel.id}`}
                      className="text-primary hover:underline"
                    >
                      View Details
                    </Link>
                  ),
                },
              ]}
            />
          </TabPanel>

          {/* Tab 2: Scheduled Downtime */}
          <TabPanel header="Scheduled Downtime" leftIcon="pi pi-clock mr-2">
            {/* Filters */}
            {/* Filters */}
            <div className="grid p-fluid mb-4">
              <div className="col-12 md:col-6 lg:col-3">
                <label className="block text-sm font-medium mb-1">
                  Application
                </label>
                <Dropdown
                  value={dtAppFilter}
                  options={appOptions}
                  onChange={(e) => setDtAppFilter(e.value)}
                  placeholder="All Systems"
                  className="w-full p-inputtext-sm dashboard-filter-height"
                  showClear
                />
              </div>
              <div className="col-12 md:col-6 lg:col-3">
                <label className="block text-sm font-medium mb-1">
                  Start Date
                </label>
                <Calendar
                  value={dtFromDate}
                  onChange={(e) => setDtFromDate(e.value ?? null)}
                  placeholder="dd/mm/yyyy"
                  className="w-full p-inputtext-sm dashboard-filter-height"
                  showIcon
                />
              </div>
              <div className="col-12 md:col-6 lg:col-3">
                <label className="block text-sm font-medium mb-1">
                  End Date
                </label>
                <Calendar
                  value={dtToDate}
                  onChange={(e) => setDtToDate(e.value ?? null)}
                  placeholder="dd/mm/yyyy"
                  className="w-full p-inputtext-sm dashboard-filter-height"
                  showIcon
                  minDate={dtFromDate || undefined}
                />
              </div>
              <div className="col-12 md:col-6 lg:col-3">
                <label className="block text-sm font-medium mb-1">Status</label>
                <div className="flex gap-2">
                  <Dropdown
                    value={dtStatusFilter}
                    options={[
                      { label: "Planned", value: "Planned" },
                      { label: "In Progress", value: "In Progress" },
                      { label: "Completed", value: "Completed" },
                    ]}
                    onChange={(e) => setDtStatusFilter(e.value)}
                    placeholder="All Statuses"
                    className="w-full p-inputtext-sm flex-1 dashboard-filter-height"
                    showClear
                  />
                  <Button
                    icon="pi pi-filter-slash"
                    className="p-button-outlined p-button-secondary dashboard-filter-height"
                    onClick={resetDtFilters}
                    tooltip="Clear Filters"
                    tooltipOptions={{ position: "top" }}
                  />
                </div>
              </div>
            </div>

            {/* Table */}
            <DataTable
              title="Downtime Records"
              data={filteredDowntimes}
              loading={loading}
              columns={[
                {
                  header: "Application",
                  field: "applicationName",
                  sortable: true,
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
                },
                {
                  header: "Status",
                  body: (dt: Downtime) => getStatusBadge(dt),
                  sortable: false,
                },
              ]}
            />
          </TabPanel>
        </TabView>
      </div>
    </div>
  );
};

export default Dashboard;
