import React, { useState, useEffect } from 'react';
import * as Yup from 'yup';
import { toast } from 'react-toastify';

import MasterDataView from '../../../Components/Common/MasterDataView';

import { getLoggedinUser } from '../../../helpers/api_helper';

import {
    getMemberIdTypeList,
    createMemberIdType,
    updateMemberIdType,
    deleteMemberIdType,
} from '../../../helpers/backend_helper';

const iconMap = {
    'NRIC':            'ri-bank-card-line',
    'Passport':        'ri-passport-line',
    'FIN':             'ri-file-user-line',
    'Work Permit':     'ri-briefcase-line',
    'Driving License': 'ri-car-line',
};

const COLUMNS = [
    {
        key: 'id_name',
        label: 'Identification Name',
        sortable: true,
        gridPrimary: true,
    },

    {
        key: 'country_code',
        label: 'Country Code',
        sortable: true,
        showInGrid: true,
    },
];

const FIELDS = [
    {
        name: 'id_name',
        label: 'Identification Name',
        placeholder: 'e.g. NRIC, Passport',
        validation: Yup.string()
            .min(2)
            .max(100)
            .required('Identification name is required'),
    },

    {
        name: 'country_code',
        label: 'Country Code',
        placeholder: 'e.g. SGP',
        required: false,
        validation: Yup.string()
            .max(3),
    },
];

const MemberType = () => {

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    const loggedUser = getLoggedinUser();

    const updatedBy =
        loggedUser?.user_id ??
        loggedUser?.id ??
        1;

    document.title = 'ASR::CSS | Member ID Type';

    // ─────────────────────────────────────────────
    // Fetch List
    // ─────────────────────────────────────────────

    const fetchList = async () => {

        setLoading(true);

        try {

            const res = await getMemberIdTypeList({
                page: 1,
                limit: 100,
                order: 'm_identification_id:ASC'
            });

            const list =
                res?.data?.data ??
                res?.data ??
                res;

            setData(Array.isArray(list) ? list : []);

        } catch (err) {

            toast.error(
                'Failed to load member identification types',
                { autoClose: 3000 }
            );

        } finally {

            setLoading(false);

        }
    };

    useEffect(() => {

        fetchList();

    }, []);

    // ─────────────────────────────────────────────
    // Add
    // ─────────────────────────────────────────────

    const handleAdd = async (values) => {

        setLoading(true);

        try {

            await createMemberIdType({
                ...values,
                updated_by: updatedBy,
            });

            toast.success(
                'Member identification type added successfully',
                { autoClose: 3000 }
            );

            await fetchList();

        } catch (err) {

            toast.error(
                err?.message || 'Failed to add member identification type',
                { autoClose: 3000 }
            );

            setLoading(false);

        }
    };

    // ─────────────────────────────────────────────
    // Edit
    // ─────────────────────────────────────────────

    const handleEdit = async (item, values) => {

        const id =
            item.m_identification_id ??
            item.id;

        setLoading(true);

        try {

            await updateMemberIdType(id, {
                ...values,
                updated_by: updatedBy,
            });

            toast.success(
                'Member identification type updated successfully',
                { autoClose: 3000 }
            );

            await fetchList();

        } catch (err) {

            toast.error(
                err?.message || 'Failed to update member identification type',
                { autoClose: 3000 }
            );

            setLoading(false);

        }
    };

    // ─────────────────────────────────────────────
    // Delete
    // ─────────────────────────────────────────────

    const handleDelete = async (item) => {

        const id =
            item.m_identification_id ??
            item.id;

        setLoading(true);

        try {

            await deleteMemberIdType(id);

            toast.success(
                'Member identification type deleted successfully',
                { autoClose: 3000 }
            );

            await fetchList();

        } catch (err) {

            toast.error(
                err?.message || 'Failed to delete member identification type',
                { autoClose: 3000 }
            );

            setLoading(false);

        }
    };

    // ─────────────────────────────────────────────
    // Custom Grid Card
    // ─────────────────────────────────────────────

    const renderGridCard = (item, index) => (

        <>
            <div
                className="avatar-sm mb-3"
                style={{ position: 'relative' }}
            >

                <div className="avatar-title bg-soft-success rounded-circle fs-22">

                    <i className={
                        iconMap[item.id_name] ||
                        'ri-profile-line'
                    }></i>

                </div>

                <span
                    className="badge bg-success rounded-pill"
                    style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        fontSize: '10px',
                        minWidth: '18px',
                        height: '18px',
                        lineHeight: '18px',
                        padding: '0 5px',
                    }}
                >
                    {index + 1}
                </span>

            </div>

            <h5 className="fs-14 mb-0 fw-semibold">
                {item.id_name}
            </h5>

            <p className="text-muted fs-11 mb-1 mt-1">
                Country Code:
                <strong>
                    {' '}
                    {item.country_code || 'Universal'}
                </strong>
            </p>

            <p className="text-muted mb-1 fs-12">&nbsp;</p>
        </>

    );

    return (

        <MasterDataView
            title="List Of Member Identification Types"

            modalTitle="Member Identification Type"

            listId="memberIDList"

            columns={COLUMNS}

            fields={FIELDS}

            data={data}

            loading={loading}

            emptyMessage="No identification types available."

            onAdd={handleAdd}

            onEdit={handleEdit}

            onDelete={handleDelete}

            renderGridCard={renderGridCard}
        />

    );
};

export default MemberType;