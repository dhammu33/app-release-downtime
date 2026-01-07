import React, { useState } from "react";
import { DataTable as PrimeDataTable } from "primereact/datatable";
import type {
  DataTableFilterMeta,
  DataTableFilterMetaData,
} from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode } from "primereact/api";
import { Skeleton } from "primereact/skeleton";
import type { ColumnFilterElementTemplateOptions } from "primereact/column";
import "./DataTable.scss";

export interface CustomColumn {
  header: string;
  field?: string;
  body?: (data: any) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  filter?: boolean;
  filterElement?: React.ReactNode | ((options: ColumnFilterElementTemplateOptions) => React.ReactNode);
  showFilterMatchModes?: boolean;
  filterPlaceholder?: string;
  headerStyle?: React.CSSProperties;
  showFilterMenu?: boolean;
}

interface DataTableProps {
  data: any[];
  columns: CustomColumn[];
  title?: string;
  onAdd?: () => void;
  filters?: DataTableFilterMeta;
  onFilterChange?: (filters: DataTableFilterMeta) => void;
  filterDisplay?: "row" | "menu";
  headerExtra?: React.ReactNode;
  loading?: boolean;
}

const DataTable: React.FC<DataTableProps> = ({
  data,
  columns,
  title,
  onAdd,
  filters: externalFilters,
  onFilterChange,
  headerExtra,
  loading = false,
}) => {
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [internalFilters, setInternalFilters] = useState<DataTableFilterMeta>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  const filters = externalFilters || internalFilters;

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    let _filters = { ...filters };

    (_filters["global"] as DataTableFilterMetaData).value = value;

    if (onFilterChange) {
      onFilterChange(_filters);
    } else {
      setInternalFilters(_filters);
    }
    setGlobalFilterValue(value);
  };

  const renderHeader = () => {
    return (
      <div className="flex flex-column md:flex-row justify-content-between align-items-center flex-wrap gap-3 w-full">
        {/* Left Side: Title */}
        <div className="flex align-items-center w-full md:w-auto">
          {title && <h2 className="m-0 text-xl font-semibold">{title}</h2>}
        </div>

        {/* Right Side: Header Extra + Search + Add Button */}
        <div className="flex flex-column sm:flex-row align-items-center gap-2 w-full md:w-auto">
          {headerExtra && (
            <div className="w-full sm:w-auto flex-shrink-0">
              {headerExtra}
            </div>
          )}
          <div className="flex align-items-center gap-2 w-full sm:w-auto">
            <span className="p-input-icon-left flex-grow-1 sm:flex-grow-0">
              <i className="pi pi-search" />
              <InputText
                value={globalFilterValue}
                onChange={onGlobalFilterChange}
                placeholder="Search..."
                className="w-full sm:w-15rem p-inputtext-sm"
              />
            </span>
            {onAdd && (
              <Button
                label="Add New"
                icon="pi pi-plus"
                style={{ backgroundColor: '#4F46E5', borderColor: '#4F46E5' }}
                className="white-space-nowrap p-button-sm flex-shrink-0"
                onClick={onAdd}
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  const header = renderHeader();

  const emptyMessage = (
    <div className="flex align-items-center justify-content-center p-4">
      <span className="text-color-secondary font-medium">
        {loading ? "Loading..." : "No records found."}
      </span>
    </div>
  );

  // If loading, create a dummy array to render skeleton rows
  const tableData = loading ? Array.from({ length: 5 }) : data;

  return (
    <PrimeDataTable
      key={loading ? "loading-skeleton" : "data-loaded"}
      value={tableData}
      paginator={!loading && data && data.length > 0}
      rows={10}
      rowsPerPageOptions={[5, 10, 25, 50]}
      dataKey="id"
      filters={!loading ? filters : undefined}
      onFilter={(e) => onFilterChange ? onFilterChange(e.filters) : setInternalFilters(e.filters)}
      globalFilterFields={columns.filter((c) => c.field).map((c) => c.field!)}
      header={header}
      emptyMessage={emptyMessage}
      className="p-datatable-sm"
      showGridlines
    >
      {columns.map((col, i) => (
        <Column
          key={i}
          field={col.field}
          header={col.header}
          sortable={!loading && col.sortable}
          body={loading ? () => <Skeleton /> : col.body}
          className={col.className}
          filter={!loading && col.filter}
          filterElement={col.filterElement}
          showFilterMatchModes={col.showFilterMatchModes}
          filterPlaceholder={col.filterPlaceholder}
          headerStyle={col.headerStyle}
          showFilterMenu={col.showFilterMenu}
        />
      ))}
    </PrimeDataTable>
  );
};

export default DataTable;
