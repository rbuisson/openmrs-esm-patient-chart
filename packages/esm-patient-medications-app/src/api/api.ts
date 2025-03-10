import useSWR from 'swr';
import { ConfigObject, openmrsFetch, Session } from '@openmrs/esm-framework';
import { OrderPost, PatientMedicationFetchResponse } from '../types/order';

/**
 * Fast, lighweight, reusable data fetcher with built-in cache invalidation that
 * returns a patient's current orders.
 * @param patientUuid The UUID of the patient whose orders should be fetched.
 * @param status The status/the kind of orders to be fetched.
 */
export function usePatientOrders(patientUuid: string, status: 'ACTIVE' | 'any', careSettingUuid: string) {
  const customRepresentation =
    'custom:(uuid,dosingType,orderNumber,accessionNumber,' +
    'patient:ref,action,careSetting:ref,previousOrder:ref,dateActivated,scheduledDate,dateStopped,autoExpireDate,' +
    'orderType:ref,encounter:ref,orderer:(uuid,display,person:(display)),orderReason,orderReasonNonCoded,orderType,urgency,instructions,' +
    'commentToFulfiller,drug:(uuid,name,strength,dosageForm:(display,uuid),concept),dose,doseUnits:ref,' +
    'frequency:ref,asNeeded,asNeededCondition,quantity,quantityUnits:ref,numRefills,dosingInstructions,' +
    'duration,durationUnits:ref,route:ref,brandName,dispenseAsWritten)';

  const { data, error, isValidating } = useSWR<{ data: PatientMedicationFetchResponse }, Error>(
    `/ws/rest/v1/order?patient=${patientUuid}&careSetting=${careSettingUuid}&status=${status}&v=${customRepresentation}`,
    openmrsFetch,
  );

  const drugOrders = data?.data?.results
    ? data.data.results.filter((order) => order.orderType.display === 'Drug Order')
    : null;

  return {
    data: data ? drugOrders : null,
    error: error,
    isLoading: !data && !error,
    isValidating,
  };
}

export function getPatientEncounterId(patientUuid: string, abortController: AbortController) {
  return openmrsFetch(`/ws/rest/v1/encounter?patient=${patientUuid}&order=desc&limit=1&v=custom:(uuid)`, {
    signal: abortController.signal,
  });
}

export function getDrugByName(drugName: string, abortController?: AbortController) {
  return openmrsFetch(
    `/ws/rest/v1/drug?q=${drugName}&v=custom:(uuid,name,strength,dosageForm:(display,uuid),concept)`,
    {
      signal: abortController?.signal,
    },
  );
}

export function getDurationUnits(abortController: AbortController, durationUnitsConcept) {
  return openmrsFetch(`/ws/rest/v1/concept/${durationUnitsConcept}?v=custom:(answers:(uuid,display))`, abortController);
}

export function getMedicationByUuid(abortController: AbortController, orderUuid: string) {
  return openmrsFetch(
    `/ws/rest/v1/order/${orderUuid}?v=custom:(uuid,route:(uuid,display),action,urgency,display,drug:(display,strength),frequency:(display),dose,doseUnits:(display),orderer,dateStopped,dateActivated,previousOrder,numRefills,duration,durationUnits:(display),dosingInstructions)`,
    {
      signal: abortController.signal,
    },
  );
}

export function getOrderTemplatesByDrug(drugUuid: string, abortController?: AbortController) {
  return openmrsFetch(`/ws/rest/v1/ordertemplates/orderTemplate?drug=${drugUuid}&retired=${false}`, {
    signal: abortController?.signal,
  });
}

export function getCurrentOrderBasketEncounter(patientUuid: string, abortController?: AbortController) {
  const [nowDateString] = new Date().toISOString().split('T');
  return openmrsFetch(`/ws/rest/v1/encounter?patient=${patientUuid}&fromdate=${nowDateString}&limit=1`, {
    signal: abortController?.signal,
  });
}

export function createEmptyEncounter(
  patientUuid: string,
  sessionObject: Session,
  orderBaskestConfig: ConfigObject,
  abortController?: AbortController,
) {
  const emptyEncounter = {
    patient: patientUuid,
    location: sessionObject.sessionLocation.uuid,
    encounterType: orderBaskestConfig.drugOrderEncounterType,
    encounterDatetime: new Date().toISOString(),
    encounterProviders: [
      {
        provider: sessionObject.currentProvider?.uuid,
        encounterRole: orderBaskestConfig.clinicianEncounterRole,
      },
    ],
    obs: [],
  };

  return openmrsFetch('/ws/rest/v1/encounter', {
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: emptyEncounter,
    signal: abortController?.signal,
  });
}

export function postOrder(body: OrderPost, abortController?: AbortController) {
  return openmrsFetch(`/ws/rest/v1/order`, {
    method: 'POST',
    signal: abortController?.signal,
    headers: { 'Content-Type': 'application/json' },
    body,
  });
}
