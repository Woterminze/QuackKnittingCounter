import { useStore } from './store';
import { useRoute } from './router';
import { ProjectList } from './ProjectList';
import { ProjectForm } from './ProjectForm';
import { ProjectView } from './ProjectView';
import { Settings } from './Settings';
import { Frog } from './Frog';
import { TopBar } from './common';

function NotFound() {
  return (
    <>
      <TopBar title="Не нашлось" back="/" />
      <main className="page empty" data-testid="not-found">
        <Frog mood="sad" size={120} />
        <h2>Такого проекта нет</h2>
        <a className="btn primary" href="#/">
          К проектам
        </a>
      </main>
    </>
  );
}

export function App() {
  const { projects, error } = useStore();
  const route = useRoute();

  if (projects === null) {
    return (
      <main className="page empty" aria-busy="true">
        <Frog mood="sleepy" size={96} />
      </main>
    );
  }

  const find = (id: string) => projects.find((p) => p.id === id);
  let screen;
  switch (route.name) {
    case 'new':
      screen = <ProjectForm key="new" />;
      break;
    case 'edit': {
      const p = find(route.id);
      screen = p ? <ProjectForm key={p.id} project={p} /> : <NotFound />;
      break;
    }
    case 'project': {
      const p = find(route.id);
      screen = p ? <ProjectView key={p.id} project={p} /> : <NotFound />;
      break;
    }
    case 'settings':
      screen = <Settings />;
      break;
    default:
      screen = <ProjectList />;
  }

  return (
    <div className="app">
      {error && (
        <div className="error-bar" role="alert" data-testid="storage-error">
          {error}
        </div>
      )}
      {screen}
    </div>
  );
}
