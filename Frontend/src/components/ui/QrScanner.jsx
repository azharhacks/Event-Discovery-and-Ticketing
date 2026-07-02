import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function QrScanner({ onScan, onError }) {
  const [active, setActive] = useState(false);
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);
  const html5Ref = useRef(null);

  const stopScanner = async () => {
    if (html5Ref.current) {
      try {
        await html5Ref.current.stop();
        await html5Ref.current.clear();
      } catch {
        // scanner may already be stopped
      }
      html5Ref.current = null;
    }
    setActive(false);
  };

  const startScanner = async () => {
    setError(null);
    try {
      const scanner = new Html5Qrcode('qr-reader');
      html5Ref.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decoded) => {
          onScan?.(decoded);
          stopScanner();
        },
        () => {}
      );
      setActive(true);
    } catch (err) {
      const msg = err?.message || 'Could not access camera.';
      setError(msg);
      onError?.(msg);
    }
  };

  useEffect(() => {
    return () => { stopScanner(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={scannerRef}>
      <div
        id="qr-reader"
        style={{
          width: '100%',
          borderRadius: 8,
          overflow: 'hidden',
          display: active ? 'block' : 'none',
          marginBottom: 12,
        }}
      />
      {!active ? (
        <button
          type="button"
          onClick={startScanner}
          style={{
            width: '100%',
            padding: '10px',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 13,
            marginBottom: 12,
          }}
        >
          Open Camera Scanner
        </button>
      ) : (
        <button
          type="button"
          onClick={stopScanner}
          style={{
            width: '100%',
            padding: '8px',
            background: '#f1f5f9',
            color: '#475569',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 12,
            marginBottom: 12,
          }}
        >
          Stop Camera
        </button>
      )}
      {error && (
        <p style={{ fontSize: 12, color: '#b91c1c', margin: '0 0 12px' }}>{error}</p>
      )}
    </div>
  );
}
