'use strict';
// Persistent demo/seed data for the compliance module — covers all 9 event types,
// every stored workflow status, extensions, waivers (general + AGM dispense/exempt),
// and document checklists. Unlike the throwaway _verify_*_tmp.js scripts used during
// development, this script's inserted rows are NOT cleaned up — they're meant to stay
// as demo data. Safe to re-run: it is NOT idempotent (will duplicate rows if run twice),
// so run it once only.
require('dotenv').config();
const dbContext = require('./src/storage/dbContext');
const { getSequelizeForDb } = require('./src/models/index');

const USER_ID = 1;
const iso = (d) => d.toISOString().slice(0, 10);
const daysFromNow = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); };
const addDaysIso = (dateIso, n) => { const d = new Date(dateIso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return iso(d); };

(async () => {
    const db = await getSequelizeForDb('asr_css');
    if (!db) throw new Error('Could not connect to DB');

    await dbContext.run({ models: db }, async () => {
        const now = new Date();
        const summary = { events: 0, extensions: 0, waivers: 0, checklistTemplates: 0, documents: 0 };

        console.log('\n[1] Enabling extension/waiver/evidence flags on the 5 non-system event types...');
        await db.company_event_name.update(
            { supports_extension: true, supports_waiver: true, operational_lead_days: 14, grace_period_days: 7, updated_by: USER_ID, updated_date: now },
            { where: { e_id: 5 } } // Annual General Meeting
        );
        await db.company_event_name.update(
            { supports_extension: true, supports_waiver: true, operational_lead_days: 10, grace_period_days: 5, updated_by: USER_ID, updated_date: now },
            { where: { e_id: 6 } } // Annual Return Filing
        );
        await db.company_event_name.update(
            { supports_waiver: true, evidence_required: true, operational_lead_days: 5, updated_by: USER_ID, updated_date: now },
            { where: { e_id: 7 } } // Board Resolution
        );
        await db.company_event_name.update(
            { supports_extension: true, supports_waiver: true, evidence_required: true, operational_lead_days: 14, grace_period_days: 10, updated_by: USER_ID, updated_date: now },
            { where: { e_id: 8 } } // Tax Filing
        );
        await db.company_event_name.update(
            { supports_extension: true, operational_lead_days: 7, updated_by: USER_ID, updated_date: now },
            { where: { e_id: 9 } } // Service Review
        );
        console.log('  Done.');

        console.log('\n[2] Creating document checklist templates (Board Resolution, Tax Filing)...');
        const [boardResTemplateA, boardResTemplateB] = await Promise.all([
            db.compliance_document_checklist_template.create({
                event_master_id: 7, document_name: 'Signed Board Resolution', description: 'Original signed copy', is_mandatory: true, sort_order: 0,
                is_deleted: false, created_date: now, created_by: USER_ID, updated_date: now, updated_by: USER_ID,
            }),
            db.compliance_document_checklist_template.create({
                event_master_id: 7, document_name: 'Company Seal Confirmation', description: null, is_mandatory: false, sort_order: 1,
                is_deleted: false, created_date: now, created_by: USER_ID, updated_date: now, updated_by: USER_ID,
            }),
        ]);
        const [taxTemplateA, taxTemplateB] = await Promise.all([
            db.compliance_document_checklist_template.create({
                event_master_id: 8, document_name: 'Tax Computation Working', description: null, is_mandatory: true, sort_order: 0,
                is_deleted: false, created_date: now, created_by: USER_ID, updated_date: now, updated_by: USER_ID,
            }),
            db.compliance_document_checklist_template.create({
                event_master_id: 8, document_name: 'Supporting Schedules', description: null, is_mandatory: true, sort_order: 1,
                is_deleted: false, created_date: now, created_by: USER_ID, updated_date: now, updated_by: USER_ID,
            }),
        ]);
        summary.checklistTemplates = 4;
        console.log('  Done. Template IDs:', { boardResTemplateA: boardResTemplateA.checklist_template_id, boardResTemplateB: boardResTemplateB.checklist_template_id, taxTemplateA: taxTemplateA.checklist_template_id, taxTemplateB: taxTemplateB.checklist_template_id });

        console.log('\n[3] Creating company_event rows across 6 companies / all 9 event types / all 13 statuses...');

        const mkEvent = async ({ entityId, eventId, slug, status, dueDate, extendedDueDate = null, filingDate = null, graceDays = 0, leadDays = 7, remarks = null }) => {
            const operationalTarget = dueDate ? addDaysIso(dueDate, -leadDays) : null;
            const graceEnd = dueDate && graceDays > 0 ? addDaysIso(dueDate, graceDays) : null;
            const penaltyStart = dueDate ? addDaysIso(dueDate, graceDays) : null;
            const row = await db.company_event.create({
                entity_id: entityId, event_id: eventId, event_slug: slug, status,
                due_date: dueDate, extended_due_date: extendedDueDate, filing_date: filingDate,
                operational_target_date: operationalTarget, grace_end_date: graceEnd, penalty_start_date: penaltyStart,
                source_from: 'MANUAL', source_basis: 'Seed Demo Data', remarks,
                sender_email: 'compliance@asrcss.demo', reply_to_email: 'compliance@asrcss.demo',
                receiving_parties: { officials: [], users: [], custom: [{ name: 'Compliance Team', email: 'compliance@asrcss.demo', channel: 'TO' }] },
                is_deleted: false, created_date: now, created_by: USER_ID, updated_date: now, updated_by: USER_ID,
            });
            summary.events += 1;
            return row;
        };

        // ── Entity 3: ABC PVT LTD (Singapore) ──
        const e3_ar = await mkEvent({ entityId: 3, eventId: 6, slug: 'annual-return-filing', status: 'PENDING', dueDate: daysFromNow(25), leadDays: 10 });
        const e3_agm = await mkEvent({ entityId: 3, eventId: 4, slug: 'agm', status: 'AWAITING_DOCUMENTS', dueDate: daysFromNow(10) });
        const e3_ar_overdue = await mkEvent({ entityId: 3, eventId: 2, slug: 'ar', status: 'PENDING', dueDate: daysFromNow(-15) });
        const e3_tax_completed = await mkEvent({
            entityId: 3, eventId: 8, slug: 'tax-filing', status: 'COMPLETED',
            dueDate: daysFromNow(-30), extendedDueDate: daysFromNow(-20), filingDate: daysFromNow(-22), leadDays: 14, graceDays: 10,
            remarks: 'Filed on time against the approved extended due date.',
        });

        // ── Entity 7: Centrum Lux Decoders Pte Ltd (Singapore) ──
        const e7_agm = await mkEvent({ entityId: 7, eventId: 4, slug: 'agm', status: 'IN_PREPARATION', dueDate: daysFromNow(45) });
        const e7_agm2 = await mkEvent({
            entityId: 7, eventId: 5, slug: 'annual-general-meeting', status: 'AWAITING_APPROVAL',
            dueDate: daysFromNow(30), extendedDueDate: daysFromNow(40), leadDays: 14, graceDays: 7,
        });
        const e7_board = await mkEvent({ entityId: 7, eventId: 7, slug: 'board-resolution', status: 'AWAITING_CLIENT', dueDate: daysFromNow(5), leadDays: 5 });

        // ── Entity 8: Nature Care Pte Ltd (Singapore) ──
        const e8_ar_late = await mkEvent({ entityId: 8, eventId: 2, slug: 'ar', status: 'COMPLETED', dueDate: daysFromNow(-30), filingDate: daysFromNow(-25), remarks: 'Filed 5 days after the statutory due date.' });
        const e8_agm_dispense = await mkEvent({ entityId: 8, eventId: 4, slug: 'agm', status: 'DISPENSE', dueDate: daysFromNow(60), remarks: 'AGM dispensed by unanimous shareholder resolution.' });
        const e8_service_cancelled = await mkEvent({ entityId: 8, eventId: 9, slug: 'service-review', status: 'CANCELLED', dueDate: daysFromNow(15), leadDays: 7 });
        const e8_ar_filed = await mkEvent({ entityId: 8, eventId: 6, slug: 'annual-return-filing', status: 'FILED', dueDate: daysFromNow(-2), filingDate: daysFromNow(-3), leadDays: 10 });

        // ── Entity 9: Bizsafe International Pte Ltd (Singapore, PENDING company status) ──
        const e9_ar_ready = await mkEvent({ entityId: 9, eventId: 6, slug: 'annual-return-filing', status: 'READY_TO_FILE', dueDate: daysFromNow(3), leadDays: 10 });
        const e9_tax_waived = await mkEvent({ entityId: 9, eventId: 8, slug: 'tax-filing', status: 'WAIVED', dueDate: daysFromNow(10), leadDays: 14, graceDays: 10, remarks: 'Waived — company below the small-company tax filing threshold this year.' });
        const e9_eci_na = await mkEvent({ entityId: 9, eventId: 1, slug: 'eci', status: 'NOT_APPLICABLE', dueDate: daysFromNow(90) });

        // ── Entity 10: Welcome Aboard Pte Ltd (Malaysia) ──
        const e10_agm_exempt = await mkEvent({ entityId: 10, eventId: 4, slug: 'agm', status: 'EXEMPT', dueDate: daysFromNow(50), remarks: 'AGM exemption approved per company constitution.' });
        const e10_ar_grace = await mkEvent({
            entityId: 10, eventId: 6, slug: 'annual-return-filing', status: 'AWAITING_DOCUMENTS',
            dueDate: daysFromNow(-3), leadDays: 10, graceDays: 5,
            remarks: 'Past due date but still within the 5-day grace period — no penalty yet.',
        });

        // ── Entity 11: Alpha Shine Ltd 2 (Singapore, INACTIVE company) ──
        const e11_anniversary = await mkEvent({ entityId: 11, eventId: 3, slug: 'anniversary', status: 'PENDING', dueDate: daysFromNow(180) });
        const e11_board_rejected = await mkEvent({ entityId: 11, eventId: 7, slug: 'board-resolution', status: 'AWAITING_DOCUMENTS', dueDate: daysFromNow(8), leadDays: 5 });

        console.log('  Created', summary.events, 'company_event rows.');

        console.log('\n[4] Creating extension records (compliance_extensions, APPROVED)...');
        await db.compliance_extension.create({
            company_event_id: e3_tax_completed.company_event_id, entity_id: 3, event_id: 8, event_slug: 'tax-filing',
            extension_type: 'GENERAL', action: 'EXTEND', request_date: now, reason: 'Additional time needed to finalize tax computation.',
            authority: 'IRAS', reference: 'EXT-DEMO-0001', previous_due_date: daysFromNow(-30), requested_due_date: daysFromNow(-20), approved_due_date: daysFromNow(-20),
            extension_days: 10, status: 'APPROVED', decision_date: now, decision_by: USER_ID, created_date: now, created_by: USER_ID,
        });
        await db.compliance_extension.create({
            company_event_id: e7_agm2.company_event_id, entity_id: 7, event_id: 5, event_slug: 'annual-general-meeting',
            extension_type: 'GENERAL', action: 'EXTEND', request_date: now, reason: 'Awaiting director availability for the meeting.',
            authority: 'ACRA', reference: 'EXT-DEMO-0002', previous_due_date: daysFromNow(30), requested_due_date: daysFromNow(40), approved_due_date: daysFromNow(40),
            extension_days: 10, status: 'APPROVED', decision_date: now, decision_by: USER_ID, created_date: now, created_by: USER_ID,
        });
        summary.extensions = 2;
        console.log('  Done.');

        console.log('\n[5] Creating waiver records (compliance_waivers — GENERAL + AGM_DISPENSE + AGM_EXEMPT)...');
        await db.compliance_waiver.create({
            company_event_id: e9_tax_waived.company_event_id, entity_id: 9, event_id: 8, event_slug: 'tax-filing',
            waiver_type: 'GENERAL', action: 'APPLY', reason: 'Below small-company tax filing threshold.', authority: 'IRAS', reference: 'WVR-DEMO-0001',
            effective_from: daysFromNow(0), effective_to: null, status: 'APPROVED', decision_date: now, decision_by: USER_ID, created_date: now, created_by: USER_ID,
        });
        await db.compliance_waiver.create({
            company_event_id: e8_agm_dispense.company_event_id, entity_id: 8, event_id: 4, event_slug: 'agm',
            waiver_type: 'AGM_DISPENSE', action: 'APPLY', reason: 'Unanimous shareholder resolution to dispense with AGM.', authority: 'ACRA', reference: 'WVR-DEMO-0002',
            effective_from: daysFromNow(0), effective_to: null, status: 'APPROVED', decision_date: now, decision_by: USER_ID, created_date: now, created_by: USER_ID,
        });
        await db.compliance_waiver.create({
            company_event_id: e10_agm_exempt.company_event_id, entity_id: 10, event_id: 4, event_slug: 'agm',
            waiver_type: 'AGM_EXEMPT', action: 'APPLY', reason: 'Exemption per company constitution.', authority: 'SSM', reference: 'WVR-DEMO-0003',
            effective_from: daysFromNow(0), effective_to: null, status: 'APPROVED', decision_date: now, decision_by: USER_ID, created_date: now, created_by: USER_ID,
        });
        summary.waivers = 3;
        console.log('  Done.');

        console.log('\n[6] Creating company_event_documents (checklist instances)...');
        // entity 3 tax-filing COMPLETED — both mandatory docs approved (satisfies the completion gate)
        await db.company_event_document.create({
            company_event_id: e3_tax_completed.company_event_id, entity_id: 3, event_id: 8, event_slug: 'tax-filing',
            checklist_template_id: taxTemplateA.checklist_template_id, document_name: taxTemplateA.document_name, is_mandatory: true, status: 'APPROVED',
            reviewed_by: USER_ID, reviewed_date: now, sort_order: 0, is_deleted: false, created_date: now, created_by: USER_ID, updated_date: now, updated_by: USER_ID,
        });
        await db.company_event_document.create({
            company_event_id: e3_tax_completed.company_event_id, entity_id: 3, event_id: 8, event_slug: 'tax-filing',
            checklist_template_id: taxTemplateB.checklist_template_id, document_name: taxTemplateB.document_name, is_mandatory: true, status: 'APPROVED',
            reviewed_by: USER_ID, reviewed_date: now, sort_order: 1, is_deleted: false, created_date: now, created_by: USER_ID, updated_date: now, updated_by: USER_ID,
        });
        // entity 7 board-resolution AWAITING_CLIENT — still outstanding
        await db.company_event_document.create({
            company_event_id: e7_board.company_event_id, entity_id: 7, event_id: 7, event_slug: 'board-resolution',
            checklist_template_id: boardResTemplateA.checklist_template_id, document_name: boardResTemplateA.document_name, is_mandatory: true, status: 'REQUIRED',
            sort_order: 0, is_deleted: false, created_date: now, created_by: USER_ID, updated_date: now, updated_by: USER_ID,
        });
        await db.company_event_document.create({
            company_event_id: e7_board.company_event_id, entity_id: 7, event_id: 7, event_slug: 'board-resolution',
            checklist_template_id: boardResTemplateB.checklist_template_id, document_name: boardResTemplateB.document_name, is_mandatory: false, status: 'REQUESTED',
            sort_order: 1, is_deleted: false, created_date: now, created_by: USER_ID, updated_date: now, updated_by: USER_ID,
        });
        // entity 11 board-resolution — one rejected, one received
        await db.company_event_document.create({
            company_event_id: e11_board_rejected.company_event_id, entity_id: 11, event_id: 7, event_slug: 'board-resolution',
            checklist_template_id: boardResTemplateA.checklist_template_id, document_name: boardResTemplateA.document_name, is_mandatory: true, status: 'REJECTED',
            remarks: 'Signature illegible — please resubmit a clearer scan.', reviewed_by: USER_ID, reviewed_date: now, sort_order: 0,
            is_deleted: false, created_date: now, created_by: USER_ID, updated_date: now, updated_by: USER_ID,
        });
        await db.company_event_document.create({
            company_event_id: e11_board_rejected.company_event_id, entity_id: 11, event_id: 7, event_slug: 'board-resolution',
            checklist_template_id: boardResTemplateB.checklist_template_id, document_name: boardResTemplateB.document_name, is_mandatory: false, status: 'RECEIVED',
            sort_order: 1, is_deleted: false, created_date: now, created_by: USER_ID, updated_date: now, updated_by: USER_ID,
        });
        summary.documents = 6;
        console.log('  Done.');

        console.log('\n✅ SEED COMPLETE (data retained — nothing cleaned up).');
        console.log(JSON.stringify(summary, null, 2));
        console.log('\nEvent IDs created:', [
            e3_ar, e3_agm, e3_ar_overdue, e3_tax_completed, e7_agm, e7_agm2, e7_board,
            e8_ar_late, e8_agm_dispense, e8_service_cancelled, e8_ar_filed,
            e9_ar_ready, e9_tax_waived, e9_eci_na, e10_agm_exempt, e10_ar_grace,
            e11_anniversary, e11_board_rejected,
        ].map(r => r.company_event_id));

        process.exit(0);
    });
})().catch(err => {
    console.error('\n❌ SEED FAILED:', err.message);
    console.error(err.stack);
    process.exit(1);
});
