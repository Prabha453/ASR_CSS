import React from 'react';
import { Container, Card, CardBody, Table } from 'reactstrap';
import BreadCrumb from '../../Components/Common/BreadCrumb';

const examples = [
  { format: 'DD-MMM-YYYY', token: '{{director_list##common.current_date | date:DD-MMM-YYYY}}', result: '18-Sep-2026' },
  { format: 'DD/MM/YYYY', token: '{{director_list##common.current_date | date:DD/MM/YYYY}}', result: '18/09/2026' },
  { format: 'YYYY-MM-DD', token: '{{director_list##common.current_date | date:YYYY-MM-DD}}', result: '2026-09-18' },
];

const officialTypeExamples = [
  {
    type: 'Individual',
    filter: 'official_type:individual',
    token: '{{director_list##official_record.name | official_type:individual}}',
    behavior: 'Shows the value only when the selected director is an individual.',
  },
  {
    type: 'Corporate',
    filter: 'official_type:corporate',
    token: '{{director_list##official_record.name | official_type:corporate}}',
    behavior: 'Shows the value only when the selected director is a corporate entity.',
  },
];

const FormBuilderInstructions = () => (
  <div className="page-content">
    <Container fluid>
      <BreadCrumb title="Instructions" pageTitle="Form Builder" />

      <Card>
        <CardBody>
          <h5 className="card-title mb-2">Date format in a shareholder adjustment template</h5>
          <p className="text-muted mb-3">
            To format the date of notice, add a formatter after the shortcode. Use a vertical bar
            (<code className="mx-1">|</code>) followed by <code>date:</code> and the desired format.
          </p>
          <ol className="mb-3">
            <li>Open the shareholder adjustment form template.</li>
            <li>In Form Content, replace the Date of notice shortcode with the example below.</li>
            <li>Save the template and use HTML View to check the rendered date.</li>
          </ol>
          <div className="bg-light rounded p-3 mb-3">
            <div className="text-muted small mb-1">Template example</div>
            <code>Date of notice: {'{{director_list##common.current_date | date:DD-MMM-YYYY}}'}</code>
          </div>

          <div className="table-responsive">
            <Table className="align-middle mb-3">
              <thead className="table-light">
                <tr><th>Format</th><th>Shortcode</th><th>Example output</th></tr>
              </thead>
              <tbody>
                {examples.map(({ format, token, result }) => (
                  <tr key={format}>
                    <td><code>{format}</code></td>
                    <td><code>{token}</code></td>
                    <td>{result}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
          <p className="text-muted small mb-2">Example outputs use 18 September 2026.</p>
          <p className="mb-2">
            <code>{'{{director_list##common.current_date DD-MMM-YYYY}}'}</code> does not work:
            the format has no <code>| date:</code> formatter.
          </p>
          <p className="mb-0">
            <code>common.current_date</code> is a system date, so it does not require a director
            selection. You can also use <code>{'{{common.current_date | date:DD-MMM-YYYY}}'}</code>.
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h5 className="card-title mb-2">Filter official fields by individual or corporate type</h5>
          <p className="text-muted mb-3">
            One official pop-up field can list both individual and corporate directors. Add an
            <code className="mx-1">official_type:</code> condition to each merge field so that only
            the section matching the selected director receives data.
          </p>

          <div className="bg-light rounded p-3 mb-3">
            <div className="text-muted small mb-1">Syntax</div>
            <code>{'{{popup_field##official_record.field | official_type:individual}}'}</code>
            <br />
            <code>{'{{popup_field##official_record.field | official_type:corporate}}'}</code>
          </div>

          <div className="table-responsive">
            <Table className="align-middle mb-3">
              <thead className="table-light">
                <tr><th>Director type</th><th>Filter</th><th>Template example</th><th>Behavior</th></tr>
              </thead>
              <tbody>
                {officialTypeExamples.map(({ type, filter, token, behavior }) => (
                  <tr key={type}>
                    <td>{type}</td>
                    <td><code>{filter}</code></td>
                    <td><code>{token}</code></td>
                    <td>{behavior}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          <h6 className="mb-2">Important behavior</h6>
          <ul className="mb-3">
            <li>
              Use the same pop-up field key, such as <code>director_list</code>, for both sections.
            </li>
            <li>
              Add the condition to every merge field in the section. An unfiltered field will be
              populated for both director types.
            </li>
            <li>
              A nonmatching condition renders an empty value. If a conditioned shortcode has no
              mapping or data, the shortcode text is also hidden.
            </li>
            <li>
              The condition hides only the merge-field value. Static labels and section text remain
              in the document.
            </li>
          </ul>

          <div className="bg-light rounded p-3 mb-3">
            <div className="text-muted small mb-1">Individual section example</div>
            <code>{'Full name: {{director_list##official_record.name | official_type:individual}}'}</code>
            <br />
            <code>{'Date of birth: {{director_list##official_record.date_of_birth | official_type:individual | date:DD-MMM-YYYY}}'}</code>
          </div>

          <div className="bg-light rounded p-3 mb-0">
            <div className="text-muted small mb-1">Corporate section example</div>
            <code>{'Entity name: {{director_list##official_record.name | official_type:corporate}}'}</code>
            <br />
            <code>{'Company type: {{director_list##official_record.company_type | official_type:corporate}}'}</code>
            <br />
            <code>{'Registered office: {{director_list##official_record.registered_company_address | official_type:corporate}}'}</code>
          </div>
        </CardBody>
      </Card>
    </Container>
  </div>
);

export default FormBuilderInstructions;
