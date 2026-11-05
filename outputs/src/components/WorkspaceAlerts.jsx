import { AlertCircle, CheckCircle2, LoaderCircle, X } from "lucide-react";

export default function WorkspaceAlerts({ error, success, loading, onClearError, onClearSuccess }) {
  return (
    <>
      {error && (
        <div className="workspace-alert error-alert" role="alert">
          <AlertCircle size={16} />
          {error}
          <button onClick={onClearError} aria-label="Dismiss error"><X size={15} /></button>
        </div>
      )}
      {success && (
        <div className="workspace-alert success-alert" role="status">
          <CheckCircle2 size={16} />
          {success}
          <button onClick={onClearSuccess} aria-label="Dismiss message"><X size={15} /></button>
        </div>
      )}
      {loading && (
        <div className="loading-banner">
          <LoaderCircle className="spin" size={16} /> Syncing your learning workspace…
        </div>
      )}
    </>
  );
}
