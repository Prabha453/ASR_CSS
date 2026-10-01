import React, { useState, useEffect } from 'react';
import * as Yup from 'yup';
import { toast } from 'react-toastify';

import MasterDataView from '../../../Components/Common/MasterDataView';
import { getLoggedinUser } from '../../../helpers/api_helper';

import {
  getCompanySSICCodeList,
  createCompanySSICCode,
  updateCompanySSICCode,
  deleteCompanySSICCode,
  getCountriesList,
} from '../../../helpers/backend_helper';

const CompanySSICCode = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [countriesData, setCountriesData] = useState([]);

  const loggedUser = getLoggedinUser();
  const updatedBy = loggedUser?.user_id ?? loggedUser?.id ?? 1;

  
const COLUMNS = [
  { key: 'ssic_code', label: 'SSIC Code', sortable: true, gridPrimary: true },
  { key: 'ssic_description', label: 'Description', sortable: true, showInGrid: true },
  { key: 'country_name', label: 'Country', sortable: true, showInGrid: true },
  { key: 'country_code', label: 'Country Code', sortable: true, showInGrid: true },
];

const FIELDS = [
  {
    name: 'ssic_code',
    label: 'SSIC Code',
    placeholder: 'e.g. 62011',
    col: 4,
    validation: Yup.string()
      .max(20)
      .required('SSIC code is required'),
  },
  {
      name: 'country',
      label: 'Country',
      type: 'select',
      options: countriesData,
      col: 4,
      validation: Yup.string()
          .max(100)
          .required('Country is required'),
  },
  {
      name: 'country_code',
      label: 'Country Code',
      placeholder: 'e.g. SGP',
      col: 4,
      required: false,
      readonly: (values) => {
          const selectedCountry = countriesData.find(
              (c) => String(c.value) === String(values.country)
          );

          return !!selectedCountry && !!selectedCountry?.code;
      },
      validation: Yup.string()
          .max(3),
  },
  {
    name: 'ssic_description',
    label: 'SSIC Description',
    type: 'textarea',
    placeholder: 'Enter SSIC description',
    col: 12,
    validation: Yup.string()
      .max(500)
      .required('SSIC description is required'),
  },
];

  const fetchList = async () => {
    setLoading(true);

    try {
      const res = await getCompanySSICCodeList({ page: 1, limit: 100 ,order: 'ssic_id:ASC'});

      const list =
        res?.data?.data ??
        res?.data ??
        res;

      setData(Array.isArray(list) ? list : []);
    } catch (err) {
      toast.error('Failed to load company SSIC codes', { autoClose: 3000 });
    } finally {
      setLoading(false);
    }
  };

   const fetchCountryList = async () => {
       setLoading(true);

        try {
            const res = await getCountriesList({
                page: 1,
                limit: 1000,
            });

            const list =
                res?.data?.data ??
                res?.data ??
                res;

            const formattedCountries = Array.isArray(list)
                ? list.map((item) => ({
                    label: item.name, 
                    value: item.id,
                    code: item.iso3,
                }))
                : [];

            setCountriesData(formattedCountries);

        } catch (err) {
            toast.error(
                'Failed to load countries',
                { autoClose: 3000 }
            );
        } finally {
            setLoading(false);
        }
    };

  useEffect(() => {
    fetchList();
    fetchCountryList();
  }, []);

  const handleAdd = async (values) => {
    setLoading(true);

    try {
      await createCompanySSICCode({
        ...values,
        updated_by: updatedBy,
      });

      toast.success('Company SSIC code added successfully', { autoClose: 3000 });

      await fetchList();
    } catch (err) {
      toast.error(err || 'Failed to add company SSIC code', { autoClose: 3000 });

      setLoading(false);
    }
  };

  const handleEdit = async (item, values) => {
    const id =
      item.ssic_id ??
      item.id;

    setLoading(true);

    try {
      await updateCompanySSICCode(id, {
        ...values,
        updated_by: updatedBy,
      });

      toast.success('Company SSIC code updated successfully', { autoClose: 3000 });

      await fetchList();
    } catch (err) {
      toast.error(err || 'Failed to update company SSIC code', { autoClose: 3000 });

      setLoading(false);
    }
  };

  const handleDelete = async (item) => {
    const id =
      item.ssic_id ??
      item.id;

    setLoading(true);

    try {
      await deleteCompanySSICCode(id);

      toast.success('Company SSIC code deleted successfully', { autoClose: 3000 });

      await fetchList();
    } catch (err) {
      toast.error(err || 'Failed to delete company SSIC code', { autoClose: 3000 });

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
      title="List Of Company SSIC Codes"
      modalTitle="Company SSIC Code"
      listId="companySSICCodeList"
      columns={COLUMNS}
      fields={FIELDS}
      data={data}
      loading={loading}
      emptyMessage="No company SSIC codes found."
      onAdd={handleAdd}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onFieldChange={handleFieldChange}
    />
  );
};

export default CompanySSICCode;