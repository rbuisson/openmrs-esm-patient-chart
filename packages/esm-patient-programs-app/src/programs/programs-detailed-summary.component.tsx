import React from 'react';
import { useTranslation } from 'react-i18next';
import capitalize from 'lodash-es/capitalize';
import {
  Button,
  DataTable,
  DataTableHeader,
  DataTableRow,
  DataTableSkeleton,
  InlineLoading,
  InlineNotification,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from '@carbon/react';
import { Add, Edit } from '@carbon/react/icons';
import { formatDate, formatDatetime, useConfig, usePagination, ConfigObject } from '@openmrs/esm-framework';
import { CardHeader, EmptyState, ErrorState, launchPatientWorkspace } from '@openmrs/esm-patient-common-lib';
import { useAvailablePrograms, useEnrollments, usePrograms } from './programs.resource';
import { ConfigurableProgram } from '../types';
import ProgramActionButton from './program-action-button/program-action-button.component';
import styles from './programs-detailed-summary.scss';

interface ProgramsDetailedSummaryProps {
  patientUuid: string;
}

const ProgramsDetailedSummary: React.FC<ProgramsDetailedSummaryProps> = ({ patientUuid }) => {
  const { t } = useTranslation();
  const displayText = t('programEnrollments', 'Program enrollments');
  const headerTitle = t('carePrograms', 'Care Programs');
  const config = useConfig() as ConfigObject;
  const programsCount = 5;
  const isConfigurable = config.customUrl ? true : false;

  const { enrollments, isLoading, isError, isValidating, availablePrograms, eligiblePrograms, configurablePrograms } =
    usePrograms(patientUuid);

  const {
    results: paginatedEnrollments,
    goTo,
    currentPage,
  } = usePagination(isConfigurable ? configurablePrograms : enrollments ?? [], programsCount);

  const tableHeaders: Array<DataTableHeader> = React.useMemo(
    () => [
      {
        key: 'display',
        header: t('activePrograms', 'Active programs'),
      },
      {
        key: 'location',
        header: t('location', 'Location'),
      },
      {
        key: 'dateEnrolled',
        header: t('dateEnrolled', 'Date enrolled'),
      },
      {
        key: 'status',
        header: t('status', 'Status'),
      },
      {
        key: 'actions',
        header: t('actions', 'Actions'),
      },
    ],
    [t],
  );

  const tableRows = React.useMemo(() => {
    return enrollments?.map((program) => {
      return {
        id: program.uuid,
        display: program.display,
        location: program.location?.display,
        dateEnrolled: formatDatetime(new Date(program.dateEnrolled)),
        status: program.dateCompleted
          ? `${t('completedOn', 'Completed On')} ${formatDate(new Date(program.dateCompleted))}`
          : t('active', 'Active'),
        actions: <ProgramEditButton programEnrollmentId={program.uuid} />,
      };
    });
  }, [enrollments, t]);

  const launchProgramsForm = React.useCallback(() => launchPatientWorkspace('programs-form-workspace'), []);

  if (isLoading) return <DataTableSkeleton role="progressbar" />;
  if (isError) return <ErrorState error={isError} headerTitle={headerTitle} />;
  if (enrollments?.length) {
    return (
      <div className={styles.widgetCard}>
        <CardHeader title={headerTitle}>
          <span>{isValidating ? <InlineLoading /> : null}</span>
          <Button
            kind="ghost"
            renderIcon={(props) => <Add size={16} {...props} />}
            iconDescription="Add programs"
            onClick={launchProgramsForm}
            disabled={availablePrograms?.length && eligiblePrograms?.length === 0}
          >
            {t('add', 'Add')}
          </Button>
        </CardHeader>
        {availablePrograms?.length && eligiblePrograms?.length === 0 ? (
          <InlineNotification
            style={{ minWidth: '100%', margin: '0rem', padding: '0rem' }}
            kind={'info'}
            lowContrast
            subtitle={t('noEligibleEnrollments', 'There are no more programs left to enroll this patient in')}
            title={t('fullyEnrolled', 'Enrolled in all programs')}
          />
        ) : null}
        <DataTable rows={tableRows} headers={tableHeaders} isSortable size="xs" useZebraStyles>
          {({ rows, headers, getHeaderProps, getTableProps }) => (
            <TableContainer>
              <Table {...getTableProps()}>
                <TableHead>
                  <TableRow>
                    {headers.map((header) => (
                      <TableHeader
                        className={`${styles.productiveHeading01} ${styles.text02}`}
                        {...getHeaderProps({
                          header,
                          isSortable: header.isSortable,
                        })}
                      >
                        {header.header?.content ?? header.header}
                      </TableHeader>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.cells.map((cell) => (
                        <TableCell key={cell.id}>{cell.value?.content ?? cell.value}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DataTable>
      </div>
    );
  }
  return <EmptyState displayText={displayText} headerTitle={headerTitle} launchForm={launchProgramsForm} />;
};

interface ProgramEditButtonProps {
  programEnrollmentId: string;
}

function ProgramEditButton({ programEnrollmentId }: ProgramEditButtonProps) {
  const launchEditProgramsForm = React.useCallback(
    () => launchPatientWorkspace('programs-form-workspace', { programEnrollmentId }),
    [programEnrollmentId],
  );

  return (
    <Button
      kind="ghost"
      renderIcon={(props) => <Edit size={16} {...props} />}
      iconDescription="Edit Program"
      onClick={launchEditProgramsForm}
      hasIconOnly
    />
  );
}

export default ProgramsDetailedSummary;
