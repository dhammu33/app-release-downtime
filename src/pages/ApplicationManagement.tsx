import React, { useState, useRef } from 'react';
import { useData } from '../context/DataContext';
import DataTable from '../components/DataTable';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import type { Application } from '../types';
import { validateApplication, type ValidationErrors } from '../utils/validate';

const ApplicationManagement: React.FC = () => {
    const { applications, addApplication, updateApplication, deleteApplication, loading } = useData();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingApp, setEditingApp] = useState<Application | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [errors, setErrors] = useState<ValidationErrors>({});

    // Delete confirmation state
    const [deleteApp, setDeleteApp] = useState<Application | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const toast = useRef<Toast>(null);

    const handleOpenModal = (app?: Application) => {
        if (app) {
            setEditingApp(app);
            setFormData({ name: app.name, description: app.description });
        } else {
            setEditingApp(null);
            setFormData({ name: '', description: '' });
        }
        setErrors({});
        setIsModalOpen(true);
    };

    const confirmDelete = (app: Application) => {
        setDeleteApp(app);
    };

    const executeDelete = async () => {
        if (!deleteApp) return;
        setIsDeleting(true);
        try {
            await deleteApplication(deleteApp.id);
            setDeleteApp(null);
            toast.current?.show({ severity: 'success', summary: 'Successful', detail: 'Application Deleted', life: 3000 });
        } catch (error) {
            console.error("Failed to delete application", error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to delete application', life: 3000 });
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
                onClick={() => setDeleteApp(null)}
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

        const validationErrors = validateApplication(formData);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingApp) {
                await updateApplication({ ...editingApp, ...formData });
            } else {
                await addApplication(formData);
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error("Failed to save application", error);
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
                style={{ color: '#64748b' }}
            />
            <Button
                label={editingApp ? "Save Changes" : "Create Application"}
                onClick={() => handleSubmit()}
                loading={isSubmitting}
                className="font-medium"
                style={{ backgroundColor: '#4F46E5', borderColor: '#4F46E5' }}
                autoFocus
            />
        </div>
    );

    return (
        <div className="management-page fade-in">
            <Toast ref={toast} />
            <header className="page-header mb-4">
                <div>
                    <p className="text-color-secondary">Manage the list of applications available for tracking releases and downtimes.</p>
                </div>
            </header>

            <DataTable
                title="Applications"
                data={[...applications].reverse()} // Show latest first
                onAdd={() => handleOpenModal()}
                loading={loading}
                columns={[
                    { header: 'Application Name', field: 'name', sortable: true },
                    { header: 'Description', field: 'description' },
                    {
                        header: 'Actions',
                        body: (app: Application) => (
                            <div className="flex gap-2">
                                <button className="action-btn edit-btn" onClick={() => handleOpenModal(app)}>
                                    Edit
                                </button>
                                <button className="action-btn delete-btn" onClick={() => confirmDelete(app)}>
                                    Delete
                                </button>
                            </div>
                        )
                    }
                ]}
            />

            {/* Edit/Create Modal */}
            <Dialog
                header={editingApp ? 'Edit Application' : 'Add New Application'}
                visible={isModalOpen}
                style={{ width: '450px' }}
                breakpoints={{ '960px': '75vw', '641px': '90vw' }}
                footer={footer}
                onHide={() => !isSubmitting && setIsModalOpen(false)}
            >
                <div className="p-fluid">
                    <div className="field mb-4">
                        <label htmlFor="appName" className="block mb-2 text-900">Application Name</label>
                        <InputText
                            id="appName"
                            value={formData.name}
                            onChange={(e) => {
                                setFormData({ ...formData, name: e.target.value });
                                if (errors.name) setErrors({ ...errors, name: '' });
                            }}
                            className={`w-full ${errors.name ? 'p-invalid' : ''}`}
                            placeholder="e.g. CORE-API"
                            autoFocus
                        />
                        {errors.name && <small className="error-msg">{errors.name}</small>}
                    </div>
                    <div className="field">
                        <label htmlFor="appDesc" className=" block mb-2 text-900">Description</label>
                        <InputTextarea
                            id="appDesc"
                            value={formData.description}
                            onChange={(e) => {
                                setFormData({ ...formData, description: e.target.value });
                                if (errors.description) setErrors({ ...errors, description: '' });
                            }}
                            className={`w-full ${errors.description ? 'p-invalid' : ''}`}
                            rows={4}
                            autoResize
                            placeholder="Brief description of the application..."
                        />
                        {errors.description && <small className="error-msg">{errors.description}</small>}
                    </div>
                </div>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog
                visible={!!deleteApp}
                style={{ width: '450px' }}
                header="Confirm Delete"
                modal
                footer={deleteFooter}
                onHide={() => !isDeleting && setDeleteApp(null)}
            >
                <div className="flex align-items-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem', color: '#ef4444' }} />
                    {deleteApp && <span>Are you sure you want to delete <b>{deleteApp.name}</b>?</span>}
                </div>
            </Dialog>
        </div>
    );
};

export default ApplicationManagement;
