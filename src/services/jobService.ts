import { getAuthTokenString } from '../utils/auth';

export interface Job {
  _id: string;
  title: string;
  company: {
    name: string;
    logo: string;
    location: {
      city: string;
      state: string;
      country: string;
    };
    industry: string;
    size: string;
    website: string;
  };
  description: string;
  requirements: {
    experience: {
      min: number;
      max: number;
      unit: string;
    };
    skills: string[];
    education: {
      level: string;
      field: string;
    };
    certifications: string[];
  };
  details: {
    type: string;
    location: {
      type: string;
      address: string;
    };
    salary: {
      min: number;
      max: number;
      currency: string;
      period: string;
    };
    benefits: string[];
    workSchedule: string;
  };
  status: {
    isActive: boolean;
    isFeatured: boolean;
    isUrgent: boolean;
  };
  applications: {
    total: number;
    viewed: number;
    shortlisted: number;
    hired: number;
  };
  tags: string[];
  category: string;
  jobProviderLink?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobApplication {
  _id: string;
  job: string;
  applicant: string;
  status: string;
  resume?: {
    filename: string;
    url: string;
    uploadedAt: string;
  };
  coverLetter: string;
  experience: {
    years: number;
    relevantSkills: string[];
    previousCompanies: string[];
  };
  education: {
    degree: string;
    institution: string;
    graduationYear: number;
    gpa: number;
  };
  assessment: {
    quizScore: number;
    interviewScore: number;
    overallScore: number;
    feedback: string;
  };
  timeline: Array<{
    status: string;
    date: string;
    notes: string;
  }>;
  jobProviderLink?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobStatistics {
  jobs: {
    total: number;
    active: number;
    featured: number;
    urgent: number;
    byCategory: Array<{
      _id: string;
      count: number;
    }>;
  };
  applications: {
    total: number;
    pending: number;
    shortlisted: number;
    hired: number;
    byStatus: Array<{
      _id: string;
      count: number;
    }>;
  };
}

class JobService {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  }

  private async makeRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseURL}/jobs${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      credentials: 'include',
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('Job service error:', error);
      throw error;
    }
  }

  // Get all jobs with filtering
  async getJobs(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    jobProviderLink?: string;
    location?: string;
    type?: string;
    experience?: number;
    salary?: number;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<{
    success: boolean;
    data: {
      jobs: Job[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    };
  }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.makeRequest(endpoint);
  }

  // Get job by ID
  async getJobById(id: string): Promise<{
    success: boolean;
    data: Job;
  }> {
    return this.makeRequest(`/${id}`);
  }

  // Get jobs by provider link
  async getJobsByProviderLink(jobProviderLink: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<{
    success: boolean;
    data: {
      jobs: Job[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    };
  }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/provider-link/${jobProviderLink}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.makeRequest(endpoint);
  }

  // Create new job
  async createJob(jobData: Partial<Job>): Promise<{
    success: boolean;
    message: string;
    data: Job;
  }> {
    return this.makeRequest('', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
  }

  // Update job
  async updateJob(id: string, jobData: Partial<Job>): Promise<{
    success: boolean;
    message: string;
    data: Job;
  }> {
    return this.makeRequest(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(jobData),
    });
  }

  // Delete job
  async deleteJob(id: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.makeRequest(`/${id}`, {
      method: 'DELETE',
    });
  }

  // Apply for a job
  async applyForJob(jobId: string, applicationData: {
    coverLetter?: string;
    experience?: {
      years: number;
      relevantSkills: string[];
      previousCompanies: string[];
    };
    education?: {
      degree: string;
      institution: string;
      graduationYear: number;
      gpa: number;
    };
  }): Promise<{
    success: boolean;
    message: string;
    data: JobApplication;
  }> {
    return this.makeRequest(`/${jobId}/apply`, {
      method: 'POST',
      body: JSON.stringify(applicationData),
    });
  }

  // Get job applications (for job poster/admin)
  async getJobApplications(jobId: string, params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{
    success: boolean;
    data: {
      applications: JobApplication[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    };
  }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/${jobId}/applications${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.makeRequest(endpoint);
  }

  // Update application status
  async updateApplicationStatus(applicationId: string, data: {
    status: string;
    notes?: string;
  }): Promise<{
    success: boolean;
    message: string;
    data: JobApplication;
  }> {
    return this.makeRequest(`/applications/${applicationId}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Get job statistics
  async getJobStatistics(): Promise<{
    success: boolean;
    data: JobStatistics;
  }> {
    return this.makeRequest('/statistics');
  }
}

export default new JobService(); 