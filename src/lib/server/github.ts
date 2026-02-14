import { GitHubProject } from '@/types';

export function getGitHubProjects(): GitHubProject[] {
  // Tentar carregar múltiplos projetos primeiro
  const projectsEnv = process.env.GITHUB_PROJECTS;

  if (projectsEnv) {
    try {
      const projects = JSON.parse(projectsEnv);
      return projects.map((p: any, index: number) => ({
        id: p.id || `project-${index}`,
        name: p.name,
        repo: p.repo,
        token: p.token,
      }));
    } catch (error) {
      console.error('Error parsing GITHUB_PROJECTS:', error);
    }
  }

  // Fallback para configuração de projeto único
  const singleToken = process.env.GITHUB_TOKEN;
  const singleRepo = process.env.GITHUB_REPO;

  if (singleToken && singleRepo) {
    return [
      {
        id: 'default',
        name: singleRepo.split('/')[1] || 'Default Project',
        repo: singleRepo,
        token: singleToken,
      },
    ];
  }

  return [];
}

export function getGitHubProject(projectId: string): GitHubProject | null {
  const projects = getGitHubProjects();
  return projects.find((p) => p.id === projectId) || null;
}

export function getDefaultGitHubProject(): GitHubProject | null {
  const projects = getGitHubProjects();
  return projects.length > 0 ? projects[0] : null;
}
