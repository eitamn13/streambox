import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';

function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <AlertCircle className="w-16 h-16 text-sb-gray mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-white mb-2">404</h1>
        <p className="text-sb-gray mb-6">הדף שחיפשת לא קיים</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-sb-red hover:bg-sb-red-hover text-white px-6 py-3 rounded-xl font-semibold transition-colors"
        >
          <Home className="w-5 h-5" />
          חזרה לדף הבית
        </Link>
      </div>
    </div>
  );
}

export default NotFound;
