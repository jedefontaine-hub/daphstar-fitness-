"use client";

import React, { useEffect, useState } from 'react';

export default function WalkthroughAdmin() {
  const [stepsJson, setStepsJson] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/designer/walkthrough');
        const j = await res.json();
        if (j && j.ok && j.data) {
          setStepsJson(JSON.stringify(j.data, null, 2));
        } else {
          setStepsJson(JSON.stringify({ steps: [] }, null, 2));
        }
      } catch {
        setStepsJson(JSON.stringify({ steps: [] }, null, 2));
      }
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setMessage('');
    try {
      const parsed = JSON.parse(stepsJson);
      const res = await fetch('/api/designer/walkthrough', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(apiKey ? { 'x-designer-key': apiKey } : {}) },
        body: JSON.stringify(parsed)
      });
      const j = await res.json();
      if (j && j.ok) setMessage('Saved to ' + j.path);
      else setMessage('Save failed: ' + (j && j.error));
    } catch (e: unknown) {
      setMessage('Invalid JSON: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Walkthrough Editor</h2>
      <p>Edit the `specs/walkthrough.json` content below and press Save.</p>
      <div style={{ marginBottom: 8 }}>
        <label>API Key (if required):</label>
        <input value={apiKey} onChange={(e) => setApiKey(e.target.value)} style={{ width: '100%' }} />
      </div>
      <textarea value={stepsJson} onChange={(e) => setStepsJson(e.target.value)} rows={12} style={{ width: '100%', fontFamily: 'monospace' }} />
      <div style={{ marginTop: 8 }}>
        <button onClick={save} disabled={loading}>Save</button>
        <span style={{ marginLeft: 12 }}>{message}</span>
      </div>
    </div>
  );
}
