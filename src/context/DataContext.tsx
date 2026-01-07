import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Application, Downtime, Release } from '../types';
import { fetchItem, saveItem, listKeys, deleteFile } from '../services/s3Service';

interface DataContextType {
    applications: Application[];
    downtimes: Downtime[];
    releases: Release[];
    loading: boolean;
    error: string | null;
    refreshData: () => Promise<void>;
    addApplication: (app: Omit<Application, 'id'>) => Promise<void>;
    updateApplication: (app: Application) => Promise<void>;
    deleteApplication: (id: string) => Promise<void>;
    addDowntime: (dt: Omit<Downtime, 'id'>) => Promise<void>;
    updateDowntime: (dt: Downtime) => Promise<void>;
    deleteDowntime: (id: string, applicationId: string) => Promise<void>;
    addRelease: (rel: Omit<Release, 'id'>) => Promise<void>;
    updateRelease: (rel: Release) => Promise<void>;
    deleteRelease: (id: string, applicationId: string) => Promise<void>;
}

const sanitizeName = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
};

const getAppKey = (app: Application) => `applications/${sanitizeName(app.name)}.json`;

const getReleaseKey = (release: Release, appName: string) => {
    const dateStr = release.releaseDate.split('T')[0];
    return `releases/${sanitizeName(appName)}/${dateStr}-${release.version}.json`;
};

const getDowntimeKey = (downtime: Downtime, appName: string) => {
    const dateStr = downtime.startTime.split('T')[0];
    return `downtime/${sanitizeName(appName)}/${dateStr}.json`;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [applications, setApplications] = useState<Application[]>([]);
    const [downtimes, setDowntimes] = useState<Downtime[]>([]);
    const [releases, setReleases] = useState<Release[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Fetch Applications
            const appKeys = await listKeys('applications/');
            const appsPromises = appKeys.map(key => fetchItem<Application>(key));
            const apps = (await Promise.all(appsPromises)).filter((item): item is Application => item !== null);

            // 2. Fetch Downtimes
            const dtKeys = await listKeys('downtime/');
            const dtsPromises = dtKeys.map(key => fetchItem<Downtime>(key));
            const dts = (await Promise.all(dtsPromises)).filter((item): item is Downtime => item !== null);

            // 3. Fetch Releases
            const relKeys = await listKeys('releases/');
            const relPromises = relKeys.map(key => fetchItem<Release>(key));
            const rels = (await Promise.all(relPromises)).filter((item): item is Release => item !== null);

            setApplications(apps);
            setDowntimes(dts);
            setReleases(rels);
            setError(null);
        } catch (err) {
            console.error('Failed to load data from S3:', err);
            setError('An error occurred while loading data from S3.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const addApplication = async (app: Omit<Application, 'id'>) => {
        const id = sanitizeName(app.name);
        const newApp = { ...app, id };
        const key = getAppKey(newApp);

        await saveItem(key, newApp);
        setApplications(prev => [...prev, newApp]);
    };

    const updateApplication = async (app: Application) => {
        const oldApp = applications.find(a => a.id === app.id);
        if (!oldApp) return;

        const newKey = getAppKey(app);
        const oldKey = getAppKey(oldApp);

        // Save new app file
        await saveItem(newKey, app);

        // If name changed, we have a lot of cleanup/migration to do
        if (oldKey !== newKey) {
            // 1. Delete old app file
            await deleteFile(oldKey);

            // 2. Move Downtimes
            const relatedDowntimes = downtimes.filter(d => d.applicationId === app.id);
            const updatedDowntimes: Downtime[] = [];

            for (const dt of relatedDowntimes) {
                const oldDtKey = getDowntimeKey(dt, oldApp.name);

                const newDt = { ...dt, applicationName: app.name };
                const newDtKey = getDowntimeKey(newDt, app.name);

                await saveItem(newDtKey, newDt);
                if (oldDtKey !== newDtKey) {
                    await deleteFile(oldDtKey);
                }
                updatedDowntimes.push(newDt);
            }

            // 3. Move Releases
            const relatedReleases = releases.filter(r => r.applicationId === app.id);
            const updatedReleases: Release[] = [];

            for (const rel of relatedReleases) {
                const oldRelKey = getReleaseKey(rel, oldApp.name);

                const newRel = { ...rel, applicationName: app.name };
                const newRelKey = getReleaseKey(newRel, app.name);

                await saveItem(newRelKey, newRel);
                if (oldRelKey !== newRelKey) {
                    await deleteFile(oldRelKey);
                }
                updatedReleases.push(newRel);
            }

            // Update State
            setApplications(prev => prev.map(a => a.id === app.id ? app : a));

            setDowntimes(prev => {
                return prev.map(d => {
                    const updated = updatedDowntimes.find(ud => ud.id === d.id);
                    return updated || d;
                });
            });

            setReleases(prev => {
                return prev.map(r => {
                    const updated = updatedReleases.find(ur => ur.id === r.id);
                    return updated || r;
                });
            });

        } else {
            setApplications(prev => prev.map(a => a.id === app.id ? app : a));
        }
    };

    const deleteApplication = async (id: string) => {
        const app = applications.find(a => a.id === id);
        if (!app) return;

        const hasDowntime = downtimes.some(d => d.applicationId === id);
        const hasRelease = releases.some(r => r.applicationId === id);

        if (hasDowntime || hasRelease) {
            throw new Error('Cannot delete application with existing downtime or release records.');
        }

        const key = getAppKey(app);
        await deleteFile(key);
        setApplications(prev => prev.filter(a => a.id !== id));
    };

    const addDowntime = async (dt: Omit<Downtime, 'id'>) => {
        const id = `${sanitizeName(dt.applicationName)}-${dt.startTime.replace(/[:.]/g, '-')}`;
        const newDt = { ...dt, id };
        const key = getDowntimeKey(newDt, newDt.applicationName);

        await saveItem(key, newDt);
        setDowntimes(prev => [...prev, newDt]);
    };

    const updateDowntime = async (dt: Downtime) => {
        const oldDt = downtimes.find(d => d.id === dt.id);
        const newKey = getDowntimeKey(dt, dt.applicationName);

        await saveItem(newKey, dt);

        if (oldDt) {
            const oldKey = getDowntimeKey(oldDt, oldDt.applicationName);
            if (oldKey !== newKey) {
                await deleteFile(oldKey);
            }
        }

        setDowntimes(prev => prev.map(d => d.id === dt.id ? dt : d));
    };

    const deleteDowntime = async (id: string, _applicationId: string) => {
        const dt = downtimes.find(d => d.id === id);
        if (!dt) {
            console.error("Could not find downtime to delete", id);
            return;
        }

        const key = getDowntimeKey(dt, dt.applicationName);
        await deleteFile(key);
        setDowntimes(prev => prev.filter(d => d.id !== id));
    };

    const addRelease = async (rel: Omit<Release, 'id'>) => {
        const id = `${sanitizeName(rel.applicationName)}-${rel.version}-${rel.releaseDate.split('T')[0]}`;
        const newRel = { ...rel, id };
        const key = getReleaseKey(newRel, newRel.applicationName);

        await saveItem(key, newRel);
        setReleases(prev => [...prev, newRel]);
    };

    const updateRelease = async (rel: Release) => {
        const oldRel = releases.find(r => r.id === rel.id);
        const newKey = getReleaseKey(rel, rel.applicationName);

        await saveItem(newKey, rel);

        if (oldRel) {
            const oldKey = getReleaseKey(oldRel, oldRel.applicationName);
            if (oldKey !== newKey) {
                await deleteFile(oldKey);
            }
        }

        setReleases(prev => prev.map(r => r.id === rel.id ? rel : r));
    };

    const deleteRelease = async (id: string, _applicationId: string) => {
        const rel = releases.find(r => r.id === id);
        if (!rel) {
            console.error("Could not find release to delete", id);
            return;
        }

        const key = getReleaseKey(rel, rel.applicationName);
        await deleteFile(key);
        setReleases(prev => prev.filter(r => r.id !== id));
    };

    return (
        <DataContext.Provider value={{
            applications, downtimes, releases, loading, error,
            refreshData: loadData,
            addApplication, updateApplication, deleteApplication,
            addDowntime, updateDowntime, deleteDowntime,
            addRelease, updateRelease, deleteRelease
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
