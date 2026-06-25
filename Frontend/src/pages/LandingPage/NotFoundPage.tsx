import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { APP_NAME } from '../../components/constants/appConfig';

const NotFoundPage = () => (
  <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col items-center justify-center px-4">
    <p className="text-sm font-medium text-indigo-600 mb-2">404</p>
    <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 text-center mb-3">
      Page not found
    </h1>
    <p className="text-slate-600 text-center max-w-md mb-8">
      The page you requested does not exist or may have been moved. Return to {APP_NAME} to continue.
    </p>
    <div className="flex flex-wrap gap-3 justify-center">
      <Link
        to="/"
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
      >
        <Home className="h-4 w-4" />
        Go home
      </Link>
      <button
        type="button"
        onClick={() => window.history.back()}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Go back
      </button>
    </div>
  </div>
);

export default NotFoundPage;
