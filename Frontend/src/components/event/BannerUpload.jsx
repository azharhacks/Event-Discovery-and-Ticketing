import { useRef, useState } from 'react';
import { uploadBanner } from '../../lib/api';
import { getEventImageUrl } from '../../lib/images';

export default function BannerUpload({ value, onChange }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const preview = getEventImageUrl(value);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setError('Please choose a PNG, JPG, or WebP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB.');
      return;
    }

    setUploading(true);
    setError('');
    try {
      const res = await uploadBanner(file);
      onChange(res.data.url);
    } catch (err) {
      setError(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const label = {
    fontSize: 12, fontWeight: 700, color: '#66766C',
    textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8,
  };

  return (
    <div>
      <label style={label}>Event Banner (PNG / JPG)</label>

      {preview ? (
        <div style={{ marginBottom: 12, borderRadius: 8, overflow: 'hidden', border: '1px solid #E3DFD2' }}>
          <img src={preview} alt="Banner preview" style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }} />
        </div>
      ) : (
        <div style={{
          marginBottom: 12, height: 140, borderRadius: 8, border: '2px dashed #E3DFD2',
          background: '#FAF8F3', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#8A968D', fontSize: 13,
        }}>
          No banner selected
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFile}
        style={{ display: 'none' }}
        id="banner-file-input"
      />

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          style={{
            padding: '10px 18px', borderRadius: 8, border: 'none',
            background: '#128C6B', color: '#fff', fontWeight: 600, fontSize: 13,
            cursor: uploading ? 'wait' : 'pointer', fontFamily: 'inherit',
            opacity: uploading ? 0.7 : 1,
          }}
        >
          {uploading ? 'Uploading...' : preview ? 'Change Image' : 'Upload from Device'}
        </button>
        {preview && (
          <button
            type="button"
            onClick={() => onChange('')}
            style={{
              padding: '10px 18px', borderRadius: 8, border: '1.5px solid #E3DFD2',
              background: '#fff', color: '#4A5950', fontWeight: 600, fontSize: 13,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Remove
          </button>
        )}
      </div>

      {error && (
        <p style={{ color: '#ef4444', fontSize: 13, marginTop: 10, marginBottom: 0 }}>{error}</p>
      )}
      <p style={{ color: '#8A968D', fontSize: 12, marginTop: 8, marginBottom: 0 }}>
        Upload a PNG or JPG from your computer (max 5MB).
      </p>
    </div>
  );
}
