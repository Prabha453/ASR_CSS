// steps/Step5ReceivingParties.jsx
import React from 'react';
import { Row, Col, Input, Button, Spinner, Badge } from 'reactstrap';
import {
  getRoleIcon,
  mergeRoleGroupsAcrossEntities,
  emptyCustomParty,
  getCustomPartyErrors,
  CHANNELS,
} from '../multiEventHelpers';

const CHANNEL_META = {
  TO: { label: 'To', color: 'var(--vz-primary)' },
  CC: { label: 'CC', color: 'var(--vz-success)' },
  BCC: { label: 'BCC', color: 'var(--vz-warning)' },
};

const getUserDisplayName = (user = {}) => {
  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
  return fullName || user.user_name || user.email || `User #${user.user_id || user.id || ''}`;
};

const Step5ReceivingParties = ({ formData, updateFormData, errors, companyDetailsMap, loadingOfficials, users = [] }) => {
  const receivingParties = formData.receiving_parties || {};
  const userReceivingParties = formData.user_receiving_parties || {};
  const customParties = formData.custom_receiving_parties || [];
  const entities = formData.selected_entities || [];

  const roleGroups = mergeRoleGroupsAcrossEntities(entities, companyDetailsMap);

  const handleChannelChange = (roleName, channel) => {
    const current = receivingParties[roleName];
    const newValue = current === channel ? '' : channel;
    updateFormData({ receiving_parties: { ...receivingParties, [roleName]: newValue } });
  };

  const setAllChannels = (channel) => {
    const next = {};
    roleGroups.forEach(g => { next[g.roleName] = channel; });
    updateFormData({ receiving_parties: next });
  };

  const clearAllChannels = () => updateFormData({ receiving_parties: {} });

  const handleUserChannelChange = (userId, channel) => {
    const current = userReceivingParties[userId];
    const newValue = current === channel ? '' : channel;
    updateFormData({ user_receiving_parties: { ...userReceivingParties, [userId]: newValue } });
  };

  const clearUserChannels = () => updateFormData({ user_receiving_parties: {} });

  const updateCustomParty = (index, field, value) => {
    const next = customParties.map((row, i) => (i === index ? { ...row, [field]: value } : row));
    updateFormData({ custom_receiving_parties: next });
  };

  const addCustomParty = () => updateFormData({ custom_receiving_parties: [...customParties, emptyCustomParty()] });
  const removeCustomParty = (index) => updateFormData({ custom_receiving_parties: customParties.filter((_, i) => i !== index) });

  const hasAnySelection = Object.values(receivingParties).some(v => v);
  const selectedUserCount = Object.values(userReceivingParties).filter(Boolean).length;
  const selectedCount = Object.values(receivingParties).filter(Boolean).length + selectedUserCount;
  const customPartyErrors = getCustomPartyErrors(customParties);
  const userOptions = users
    .map(user => ({
      ...user,
      user_id: user.user_id || user.id,
      display_name: getUserDisplayName(user),
    }))
    .filter(user => user.user_id)
    .sort((a, b) => a.display_name.localeCompare(b.display_name));

  return (
    <div>
      <style>{`
        .rp-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
        .rp-toolbar-left { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .rp-toolbar-title { font-size: 12px; font-weight: 700; color: var(--vz-secondary-color,#878a99); text-transform: uppercase; letter-spacing: .03em; }
        .rp-toolbar-count { font-size: 11px; font-weight: 700; color: var(--vz-primary); background: rgba(var(--vz-primary-rgb),.1); border-radius: 10px; padding: 2px 9px; }
        .rp-legend { display: flex; align-items: center; gap: 10px; }
        .rp-legend-item { display: flex; align-items: center; gap: 4px; font-size: 10.5px; font-weight: 600; color: var(--vz-secondary-color,#878a99); }
        .rp-legend-dot { width: 7px; height: 7px; border-radius: 50%; display: inline-block; }
        .rp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 12px; }
        .rp-card { border: 1px solid var(--vz-border-color); border-radius: 10px; overflow: hidden; background: var(--vz-white); transition: box-shadow .15s, border-color .15s, transform .1s; }
        .rp-card:hover { box-shadow: 0 2px 6px rgba(0,0,0,.06); }
        .rp-card.active { border-color: var(--vz-primary); box-shadow: 0 2px 8px rgba(var(--vz-primary-rgb),.14); }
        .rp-card-head { display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: linear-gradient(180deg, rgba(var(--vz-primary-rgb),.06), rgba(var(--vz-primary-rgb),.015)); border-bottom: 1px solid var(--vz-border-color); }
        .rp-card-icon { width: 30px; height: 30px; border-radius: 8px; background: rgba(var(--vz-primary-rgb),.1); color: var(--vz-primary); display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0; }
        .rp-card-title { font-size: 12.5px; font-weight: 700; color: var(--vz-body-color); }
        .rp-card-meta { font-size: 10.5px; color: var(--vz-secondary-color,#878a99); }
        .rp-card-body { display: flex; gap: 6px; padding: 10px 12px; }
        .rp-chan-btn { flex: 1; text-align: center; font-size: 11px; font-weight: 700; padding: 6px 0; border-radius: 6px; border: 1px solid var(--vz-border-color); cursor: pointer; background: var(--vz-white); color: var(--vz-secondary-color,#878a99); transition: all .12s; user-select: none; }
        .rp-chan-btn:hover { border-color: var(--vz-primary); transform: translateY(-1px); }
        .rp-chan-btn.selected { color: var(--vz-white); border-color: transparent; }
        .rp-external-box { margin-top: 22px; padding: 14px; border-radius: 10px; background: var(--vz-light); border: 1px solid var(--vz-border-color); }
        .rp-external-row { border: 1px solid var(--vz-border-color); border-radius: 8px; padding: 10px 12px; background: var(--vz-white); margin-top:10px; }
        .rp-external-row:hover { border-color: var(--vz-gray-400); }
        .rp-external-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 20px 0; color: var(--vz-secondary-color,#878a99); font-size: 12px; }
        .rp-external-empty i { font-size: 22px; opacity: .5; }
      `}</style>

      {loadingOfficials && (
        <div className="d-flex align-items-center gap-2 mb-3 text-muted" style={{ fontSize: 12 }}>
          <Spinner size="sm" /> Loading officials for selected entities…
        </div>
      )}

      {!loadingOfficials && roleGroups.length === 0 && (
        <div className="cef-empty-box mb-3">
          None of the selected entities have any officials on record. You can still add
          external recipients below.
        </div>
      )}

      {roleGroups.length > 0 && (
        <>
          <div className="rp-toolbar">
            <div className="rp-toolbar-left">
              <span className="rp-toolbar-title">Roles found across selected entities</span>
              <span className="rp-toolbar-count">{selectedCount} selected</span>
              <div className="rp-legend">
                {CHANNELS.map(ch => (
                  <span key={ch} className="rp-legend-item">
                    <span className="rp-legend-dot" style={{ background: CHANNEL_META[ch].color }}></span>
                    {CHANNEL_META[ch].label}
                  </span>
                ))}
              </div>
            </div>
            <div className="d-flex gap-1 flex-wrap">
              {CHANNELS.map(ch => (
                <Button key={ch} size="sm" outline color="primary" onClick={() => setAllChannels(ch)}>
                  All → {CHANNEL_META[ch].label}
                </Button>
              ))}
              <Button size="sm" outline color="danger" onClick={clearAllChannels}>Clear all</Button>
            </div>
          </div>

          <div className="rp-grid">
            {roleGroups.map(group => {
              const active = Boolean(receivingParties[group.roleName]);
              const coversAll = group.entityCount === entities.length;
              return (
                <div key={group.roleName} className={`rp-card ${active ? 'active' : ''}`}>
                  <div className="rp-card-head">
                    <div className="rp-card-icon"><i className={getRoleIcon(group.roleName)}></i></div>
                    <div>
                      <div className="rp-card-title">{group.roleName}</div>
                      <div className="rp-card-meta">
                        {group.totalOfficials} official{group.totalOfficials !== 1 ? 's' : ''}
                        {!coversAll && ` · in ${group.entityCount}/${entities.length} entities`}
                      </div>
                    </div>
                  </div>
                  <div className="rp-card-body">
                    {CHANNELS.map(ch => {
                      const isSel = receivingParties[group.roleName] === ch;
                      return (
                        <div
                          key={ch}
                          className={`rp-chan-btn ${isSel ? 'selected' : ''}`}
                          style={isSel ? { background: CHANNEL_META[ch].color } : undefined}
                          onClick={() => handleChannelChange(group.roleName, ch)}
                        >
                          {CHANNEL_META[ch].label}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hint-text mt-2">
            <i className="ri-information-line"></i>
            One channel per role. For entities that don't have a given role, that role is
            simply skipped for them — the real officials (with real emails) are resolved
            per entity from their record, not a placeholder.
            {!hasAnySelection && <span className="text-danger ms-2">Please select at least one role.</span>}
          </div>
        </>
      )}

      {userOptions.length > 0 && (
        <div className="rp-external-box mt-3">
          <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
            <div className="cef-mini-label mb-0">
              <i className="ri-user-settings-line me-1"></i>System Users
              {selectedUserCount > 0 && <Badge color="primary-subtle" className="text-primary-emphasis ms-2">{selectedUserCount} selected</Badge>}
            </div>
            <Button size="sm" outline color="danger" onClick={clearUserChannels}>Clear users</Button>
          </div>
          <div className="rp-grid">
            {userOptions.map(user => {
              const userId = String(user.user_id);
              const activeChannel = userReceivingParties[userId] || '';
              return (
                <div key={userId} className={`rp-card ${activeChannel ? 'active' : ''}`}>
                  <div className="rp-card-head">
                    <div className="rp-card-icon"><i className="ri-user-line"></i></div>
                    <div>
                      <div className="rp-card-title">{user.display_name}</div>
                      <div className="rp-card-meta">{user.email || 'No email'}</div>
                    </div>
                  </div>
                  <div className="rp-card-body">
                    {CHANNELS.map(ch => {
                      const isSel = activeChannel === ch;
                      return (
                        <div
                          key={ch}
                          className={`rp-chan-btn ${isSel ? 'selected' : ''}`}
                          style={isSel ? { background: CHANNEL_META[ch].color } : undefined}
                          onClick={() => user.email && handleUserChannelChange(userId, ch)}
                        >
                          {CHANNEL_META[ch].label}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="rp-external-box">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div className="cef-mini-label mb-0">
            <i className="ri-mail-send-line me-1"></i>External Recipients (applied to every entity)
          </div>
          <Button size="sm" color="primary" outline onClick={addCustomParty}>
            <i className="ri-add-line"></i> Add Recipient
          </Button>
        </div>

        {customParties.length === 0 && (
          <div className="rp-external-empty">
            <i className="ri-user-add-line"></i>
            No external recipients added.
          </div>
        )}

        {customParties.map((row, index) => (
          <Row className="align-items-end mb-2 rp-external-row mx-0" key={index}>
            <Col md={3}>
              <div className="cef-mini-label">Party Type</div>
              <Input bsSize="sm" value={row.party_type || ''} onChange={(e) => updateCustomParty(index, 'party_type', e.target.value)} />
            </Col>
            <Col md={3}>
              <div className="cef-mini-label">Name</div>
              <Input bsSize="sm" value={row.name || ''} onChange={(e) => updateCustomParty(index, 'name', e.target.value)} />
            </Col>
            <Col md={3}>
              <div className="cef-mini-label">Email</div>
              <Input bsSize="sm" type="email" value={row.email || ''} onChange={(e) => updateCustomParty(index, 'email', e.target.value)} />
            </Col>
            <Col md={2}>
              <div className="cef-mini-label">Channel</div>
              <Input bsSize="sm" type="select" value={row.channel || 'TO'} onChange={(e) => updateCustomParty(index, 'channel', e.target.value)}>
                <option value="TO">To</option>
                <option value="CC">CC</option>
                <option value="BCC">BCC</option>
              </Input>
            </Col>
            <Col md={1}>
              <Button color="danger" outline size="sm" onClick={() => removeCustomParty(index)}>
                <i className="ri-delete-bin-line"></i>
              </Button>
            </Col>
          </Row>
        ))}

        {customPartyErrors.length > 0 && (
          <div className="mt-2 alert alert-danger py-2 px-3 mb-0">
            {customPartyErrors.map((err, i) => <div key={i} style={{ fontSize: 12 }}>{err}</div>)}
          </div>
        )}
      </div>

      {errors.length > 0 && (
        <div className="mt-3 alert alert-danger">
          {errors.map((err, i) => <div key={i}><i className="ri-error-warning-line"></i> {err}</div>)}
        </div>
      )}
    </div>
  );
};

export default Step5ReceivingParties;
