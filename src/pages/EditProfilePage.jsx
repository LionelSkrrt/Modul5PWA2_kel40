import { useState } from 'react'
import { ArrowLeft, Save, CheckCircle, AlertCircle, Shield, Camera } from 'lucide-react'
import userService from '../services/userService'

/**
 * EditProfilePage — Dedicated page for editing Operator Name (Callsign), Bio, and Avatar.
 */
export default function EditProfilePage({ onBack, onSuccess }) {
  const [profile] = useState(() => userService.getUserProfile())
  const [username, setUsername] = useState(profile.username || 'Shooter')
  const [bio, setBio] = useState(profile.bio || '')
  const [avatar, setAvatar] = useState(profile.avatar || null)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setError('Avatar image must be under 2MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setAvatar(event.target.result)
      setError('')
    }
    reader.readAsDataURL(file)
  }

  const handleSave = (e) => {
    e.preventDefault()
    setError('')

    if (!username.trim()) {
      setError('Callsign / Operator Alias cannot be empty.')
      return
    }

    const updated = {
      ...profile,
      username: username.trim(),
      bio: bio.trim(),
      avatar,
    }

    const result = userService.saveUserProfile(updated)
    if (result.success) {
      setSuccessMsg('Operator profile saved!')
      setTimeout(() => {
        if (onSuccess) onSuccess(result.data)
        else if (onBack) onBack()
      }, 600)
    } else {
      setError(result.message || 'Failed to save profile.')
    }
  }

  return (
    <div className="form-page">
      <div className="form-head">
        <button type="button" className="detail-back" onClick={onBack}>
          <ArrowLeft size={18} /> Back to Profile
        </button>
      </div>

      <div className="form-title-group">
        <h1 className="display">Edit Operator Profile</h1>
        <p className="lede">
          Update your callsign, station bio, and armorer credentials.
        </p>
      </div>

      {error && (
        <div className="toast toast--error">
          <AlertCircle size={18} /> {error}
        </div>
      )}
      {successMsg && (
        <div className="toast toast--success">
          <CheckCircle size={18} /> {successMsg}
        </div>
      )}

      <form onSubmit={handleSave} className="entry-form">
        <div className="card-box" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div className="avatar-wrap">
            {avatar ? (
              <img src={avatar} alt={username} className="avatar-img" />
            ) : (
              <div className="avatar-placeholder">
                <Shield size={36} stroke="var(--brass)" />
              </div>
            )}
            <label htmlFor="edit-avatar-input" className="avatar-upload-btn" title="Change avatar">
              <Camera size={14} />
              <input
                id="edit-avatar-input"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden-file-input"
              />
            </label>
          </div>
          <div>
            <h3 style={{ margin: '0 0 4px' }}>Operator Emblem / Avatar</h3>
            <p className="card-box-desc" style={{ margin: 0 }}>
              Click the camera icon to upload a custom avatar (JPG, PNG under 2MB).
            </p>
          </div>
        </div>

        <div className="card-box">
          <div className="form-group" style={{ marginBottom: '18px' }}>
            <label htmlFor="edit-prof-name" className="form-label">
              Callsign / Operator Alias <span className="req">*</span>
            </label>
            <input
              id="edit-prof-name"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. Operator Delta, Master Gunsmith"
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-prof-bio" className="form-label">
              Armory Notes / Station Bio
            </label>
            <textarea
              id="edit-prof-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Qualifications, preferred calibers, unit assignment..."
              rows={4}
              className="form-textarea"
            />
          </div>
        </div>

        <div className="form-actions-bar">
          <button type="button" className="btn btn--outline" onClick={onBack}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary">
            <Save size={16} /> Save Profile Changes
          </button>
        </div>
      </form>
    </div>
  )
}

