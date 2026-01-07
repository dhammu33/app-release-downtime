import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { formatInTimeZone } from 'date-fns-tz';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Panel } from 'primereact/panel';
import { Skeleton } from 'primereact/skeleton';
import './ReleaseDetail.scss';

const ReleaseDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { releases, loading } = useData();

    const release = releases.find(r => r.id === id);

    if (loading) return (
        <div className="release-detail-container fade-in">
            <div className="detail-header flex justify-content-between align-items-center mb-4">
                <Skeleton width="10rem" height="3rem" />
                <Skeleton width="8rem" height="3rem" />
            </div>
            <div className="grid">
                <div className="col-12 md:col-8">
                    <Skeleton height="20rem" className="mb-4" />
                </div>
                <div className="col-12 md:col-4">
                    <Skeleton height="10rem" className="mb-4" />
                    <Skeleton height="8rem" />
                </div>
            </div>
        </div>
    );

    if (!release) return (
        <div className="flex flex-column align-items-center justify-content-center h-screen">
            <i className="pi pi-exclamation-circle text-5xl text-red-500 mb-3"></i>
            <h2 className="text-900 mb-2">Release Not Found</h2>
            <p className="text-gray-400 mb-4">The release record you are looking for does not exist or has been deleted.</p>
            <Link to="/dashboard">
                <Button label="Return to Dashboard" icon="pi pi-arrow-left" className="p-button-outlined" />
            </Link>
        </div>
    );

    const headerTitle = (
        <div className="flex align-items-center gap-3">
            <span className="text-2xl font-bold text-900">{release.applicationName}</span>
            <Tag value={release.version} severity="info" className="text-base px-3 py-1" rounded></Tag>
        </div>
    );



    const formattedDate = formatInTimeZone(release.releaseDate, release.timezone || 'UTC', 'MMMM d, yyyy, HH:mm');

    return (
        <div className="release-detail-container fade-in">
            {/* Header Navigation */}
            <div className="mb-4">
                <Button
                    label="Back"
                    icon="pi pi-arrow-left"
                    className="p-button-text hover:pl-2 pl-0 text-gray-400"
                    onClick={() => navigate(-1)}
                />
            </div>

            <div className="grid">
                {/* Main Content Column */}
                <div className="col-12 md:col-12">
                    <Card title={headerTitle} className="shadow-4 mb-4" style={{ background: 'var(--surface-card)', border: '1px solid var(--surface-border)' }}>
                        <div className="grid mt-3">
                            <div className="col-12 md:col-6 mb-3">
                                <label className="block text-gray-400 text-sm mb-1">Release Date</label>
                                <div className="text-lg font-medium  flex align-items-center gap-2">
                                    <i className="pi pi-calendar text-primary"></i>
                                    {formattedDate}
                                </div>
                            </div>
                            <div className="col-12 md:col-6 mb-3">
                                <label className="block text-gray-400 text-sm mb-1">Timezone</label>
                                <div className="text-lg font-medium flex align-items-center gap-2">
                                    <i className="pi pi-globe text-primary"></i>
                                    {release.timezone || 'UTC'}
                                </div>
                            </div>
                            <div className="col-12 md:col-6 mb-3">
                                <label className="block text-gray-400 text-sm mb-1">Application ID</label>
                                <div className="text-base font-mono text-gray-300 bg-gray-800 p-1 border-round inline-block">
                                    {release.applicationId}
                                </div>
                            </div>
                            <div className="col-12 md:col-6 mb-3">
                                <label className="block text-gray-400 text-sm mb-1">Record ID</label>
                                <div className="text-sm font-mono text-gray-500 overflow-hidden text-overflow-ellipsis" title={release.id}>
                                    {release.id}
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Panel header="Release Details & Notes" toggleable className="shadow-4 border-none">
                        <div className="line-height-3 text-gray-300 white-space-pre-wrap">
                            {release.details ? release.details : <span className="font-italic text-gray-500">No additional details provided.</span>}
                        </div>
                    </Panel>
                </div>

                {/* Sidebar Column */}
                {/* <div className="col-12 md:col-4">
                    <div className="card shadow-4 p-4 border-round-xl h-full" style={{ background: 'var(--surface-card)', border: '1px solid var(--surface-border)' }}>
                        <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
                        <p className="text-gray-400 text-sm mb-4">Manage this release record or export data for reporting purposes.</p>

                        <div className="flex flex-column gap-3">
                            <Button label="Edit Release" icon="pi pi-pencil" className="p-button-outlined w-full" />
                            <Button label="Download Logs" icon="pi pi-download" className="p-button-secondary p-button-outlined w-full" />
                            <div className="border-top-1 border-gray-700 my-2"></div>
                            <Button label="Delete Record" icon="pi pi-trash" className="p-button-danger p-button-outlined w-full" />
                        </div>
                    </div>
                </div> */}
            </div>
        </div>
    );
};

export default ReleaseDetail;
