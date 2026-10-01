import React, { useState, useEffect } from 'react';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import MasterDataView from '../../../Components/Common/MasterDataView';
import { getLoggedinUser } from '../../../helpers/api_helper';
import {
    getRegionList,
    createRegion,
    updateRegion,
    deleteRegion,
} from '../../../helpers/backend_helper';


const RegionMaster = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const loggedUser = getLoggedinUser();
    const updatedBy =
        loggedUser?.user_id ??
        loggedUser?.id ??
        1;
    // ─────────────────────────────────────────────
    // Fetch List
    // ─────────────────────────────────────────────

        const COLUMNS = [
        {
            key: 'region_name',
            label: 'Region',
            sortable: true,
            gridPrimary: true,
        }
       
    ];

    const FIELDS = [
        {
            name: 'region_name',
            label: 'Region Name',
            placeholder: 'e.g. Central Region',
            validation: Yup.string()
                .min(2)
                .max(150)
                .required('Region name is required'),
        }
    ];

    const fetchList = async () => {
        setLoading(true);
        try {
            const res = await getRegionList({
                page: 1,
                limit: 100,
                order: 'region_id:ASC'
            });
            const list =
                res?.data?.data ??
                res?.data ??
                res;
            setData(Array.isArray(list) ? list : []);

        } catch (err) {
            toast.error(
                'Failed to load regions',
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
            await createRegion({
                ...values,
                updated_by: updatedBy,
            });

            toast.success(
                'Region added successfully',
                { autoClose: 3000 }
            );
            await fetchList();

        } catch (err) {
            toast.error(
                err?.message || 'Failed to add region',
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
            item.region_id ??
            item.id;
        setLoading(true);

        try {

            await updateRegion(id, {
                ...values,
                updated_by: updatedBy,
            });
            toast.success(
                'Region updated successfully',
                { autoClose: 3000 }
            );
            await fetchList();

        } catch (err) {
            toast.error(
                err?.message || 'Failed to update region',
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
            item.region_id ??
            item.id;
        setLoading(true);

        try {
            await deleteRegion(id);
            toast.success(
                'Region deleted successfully',
                { autoClose: 3000 }
            );
            await fetchList();

        } catch (err) {
            toast.error(
                err?.message || 'Failed to delete region',
                { autoClose: 3000 }
            );
            setLoading(false);
        }
    };

     const handleFieldChange = ({ event,field,values,setFieldValue}) => {
            const { name, value } = event.target;
            if (name === 'country') {
                const selectedCountry = countriesData.find(
                    (c) => String(c.value) === String(value)
                );
                setFieldValue(
                    'country_code',
                    selectedCountry?.code || ''
                );
            }
        };

    return (

        <MasterDataView
            title="List Of Regions"
            modalTitle="Region"
            listId="regionList"
            columns={COLUMNS}
            fields={FIELDS}
            data={data}
            loading={loading}
            emptyMessage="No regions found."
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onFieldChange={handleFieldChange}
        />

    );
};

export default RegionMaster;