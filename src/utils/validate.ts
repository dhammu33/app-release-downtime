export interface ValidationErrors {
    [key: string]: string;
}

export const validateApplication = (data: { name: string; description: string }) => {
    const errors: ValidationErrors = {};
    if (!data.name?.trim()) {
        errors.name = "Application name is required";
    }
    if (!data.description?.trim()) {
        errors.description = "Description is required";
    }
    return errors;
};

export const validateDowntime = (data: { applicationId: string; startTime: Date | null; endTime: Date | null }) => {
    const errors: ValidationErrors = {};
    if (!data.applicationId) {
        errors.applicationId = "Target application is required";
    }
    if (!data.startTime) {
        errors.startTime = "Start period is required";
    }
    if (!data.endTime) {
        errors.endTime = "End period is required";
    }

    if (data.startTime && data.endTime && data.startTime >= data.endTime) {
        errors.endTime = "End period must be after start period";
    }

    return errors;
};

export const validateRelease = (data: { applicationId: string; version: string; releaseDate: Date | null }) => {
    const errors: ValidationErrors = {};
    if (!data.applicationId) {
        errors.applicationId = "Target application is required";
    }
    if (!data.version?.trim()) {
        errors.version = "Version number is required";
    }
    if (!data.releaseDate) {
        errors.releaseDate = "Release date and time is required";
    }
    return errors;
};
