import { 
    FREE_MAX_STORAGE_BYTES, 
    PRO_MAX_STORAGE_BYTES,
    FREE_MAX_FILE_SIZE_BYTES,
    PRO_MAX_FILE_SIZE_BYTES
} from '@/lib/utils/constants';

export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDate = (date: string | Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export const formatPlanName = (plan: string): string => {
    const planNames: Record<string, string> = {
        'FREE': 'Free',
        'PRO_MONTHLY': 'Pro Monthly',
        'PRO_YEARLY': 'Pro Yearly',
    };
    
    return planNames[plan] || plan;
};

export const getStorageLimit = (plan: string | null): number => {
    if (!plan || plan === 'FREE') {
        return FREE_MAX_STORAGE_BYTES;
    }
    if (plan === 'PRO_MONTHLY' || plan === 'PRO_YEARLY') {
        return PRO_MAX_STORAGE_BYTES;
    }
    return FREE_MAX_STORAGE_BYTES;
};

export const getFileUploadLimit = (plan: string | null): number => {
    if (!plan || plan === 'FREE') {
        return FREE_MAX_FILE_SIZE_BYTES;
    }
    if (plan === 'PRO_MONTHLY' || plan === 'PRO_YEARLY') {
        return PRO_MAX_FILE_SIZE_BYTES;
    }
    return FREE_MAX_FILE_SIZE_BYTES;
};

export const getStorageUsagePercentage = (usedStorage: number, plan: string | null): number => {
    const limit = getStorageLimit(plan);
    return Math.min((usedStorage / limit) * 100, 100);
};

export const getPlanLimit = (plan: string | null): string => {
    const limit = getStorageLimit(plan);
    return formatFileSize(limit);
};

export const getUploadLimit = (plan: string | null): string => {
    const limit = getFileUploadLimit(plan);
    return formatFileSize(limit);
}; 