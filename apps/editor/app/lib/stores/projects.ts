import { atom } from 'nanostores';
import { apiClient } from '~/lib/api/client';

export interface McProject {
  id: string;
  name: string;
  subdomain: string;
  deployUrl: string | null;
  deployStatus: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const projectsList = atom<McProject[]>([]);
export const projectsLoading = atom<boolean>(false);
export const activeProjectId = atom<string | null>(null);

export async function loadProjects() {
  projectsLoading.set(true);

  try {
    const res = await apiClient<McProject[]>('/portal/projects');

    if (res.success && Array.isArray(res.data)) {
      projectsList.set(res.data);
    }
  } catch (err) {
    console.error('Failed to load projects:', err);
  } finally {
    projectsLoading.set(false);
  }
}

export async function createProject(name: string): Promise<McProject | null> {
  try {
    const res = await apiClient<McProject>('/portal/projects', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });

    if (res.success && res.data) {
      projectsList.set([...projectsList.get(), res.data]);
      return res.data;
    }
  } catch (err) {
    console.error('Failed to create project:', err);
  }

  return null;
}

export async function deleteProject(id: string): Promise<boolean> {
  try {
    const res = await apiClient(`/portal/projects/${id}`, { method: 'DELETE' });

    if (res.success) {
      projectsList.set(projectsList.get().filter((p) => p.id !== id));
      return true;
    }
  } catch (err) {
    console.error('Failed to delete project:', err);
  }

  return false;
}

export async function syncFilesToProject(projectId: string, files: Record<string, string>) {
  try {
    await apiClient(`/portal/projects/${projectId}/files`, {
      method: 'POST',
      body: JSON.stringify({ files }),
    });
  } catch (err) {
    console.error('Failed to sync files:', err);
  }
}
