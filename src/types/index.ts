export interface Application {
    id: string;
    name: string;
    description: string;
}

export interface Downtime {
    id: string;
    applicationId: string;
    applicationName: string;
    startTime: string;
    endTime: string;
    timezone?: string;
}

export interface Release {
    id: string;
    applicationId: string;
    applicationName: string;
    version: string;
    releaseDate: string;
    timezone?: string;
    details: string;
}

export type DataFileKey = 'applications.json' | 'downtimes.json' | 'releases.json';
