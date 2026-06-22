import React, { useState, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';
import FrontOfficeLayout from '../../layouts/FrontOfficeLayout';
import ComputerService from '../../services/Computer/ComputerService';
import MonitorService from '../../services/Monitor/MonitorService';
import SoftwareService from '../../services/Software/SoftwareService';
import PrinterService from '../../services/Printer/PrinterService';
import PDUService from '../../services/PDU/PDUService';
import RackService from '../../services/Rack/RackService';
import PhoneService from '../../services/Phone/PhoneService';
import ChassisService from '../../services/Chassis/ChassisService';
import NetworkEquipmentService from '../../services/NetworkEquipment/NetworkEquipmentService';
import SoftwareLicenseService from '../../services/SoftwareLicense/SoftwareLicenseService';
import PeripheralService from '../../services/Peripheral/PeripheralService';
import PassiveDCEquipmentService from '../../services/PassiveDCEquipment/PassiveDCEquipmentService';
import CartridgeItemService from '../../services/CartridgeItem/CartridgeItemService';
import ConsumableItemService from '../../services/ConsumableItem/ConsumableItemService';
import CableService from '../../services/Cable/CableService';
import DatabaseInstanceService from '../../services/DatabaseInstance/DatabaseInstanceService';
import DCRoomService from '../../services/DCRoom/DCRoomService';
import StateService from '../../services/State/StateService';
import LocationService from '../../services/Location/LocationService';
import ManufacturerService from '../../services/Manufacturer/ManufacturerService';
import { getElementsListItemTypes } from '../../config/itemTypes';
import '../../styles/FrontOffice.css';

const ElementsList = () => {
  const [allElements, setAllElements] = useState([]);
  const [filteredElements, setFilteredElements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [relatedData, setRelatedData] = useState({
    states: {},
    locations: {},
    manufacturers: {}
  });
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Filters state
  const [filters, setFilters] = useState({
    type: '',
    searchText: '',
    location: '',
    manufacturer: ''
  });

  const elementsListTypes = getElementsListItemTypes();
  const ITEM_TYPES = [
    { value: '', label: 'Tous les éléments' },
    ...elementsListTypes.map(type => ({ value: type.itemType, label: type.label }))
  ];

  // Fetch all elements with individual error handling
  const fetchAllElements = async () => {
    setLoading(true);
    try {
      // Helper to safely fetch data and return empty array on error
      const safeFetch = async (fetchFn, fallback = []) => {
        try {
          return await fetchFn();
        } catch (error) {
          return fallback;
        }
      };

      const elementsListTypes = getElementsListItemTypes();
      
      // Map config types to their respective service methods
      const serviceMap = {
        Computer: ComputerService.getAllComputers,
        Monitor: MonitorService.getAllMonitors,
        Software: SoftwareService.getAllSoftware,
        Printer: PrinterService.getAllPrinters,
        Pdu: PDUService.getAllPDUs,
        Rack: RackService.getAllRacks,
        Phone: PhoneService.getAllPhones,
        Enclosure: ChassisService.getAllChassis,
        NetworkEquipment: NetworkEquipmentService.getAllNetworkEquipment,
        SoftwareLicense: SoftwareLicenseService.getAllSoftwareLicenses,
        Peripheral: PeripheralService.getAllPeripherals,
        PassiveDCEquipment: PassiveDCEquipmentService.getAllPassiveDCEquipments,
        CartridgeItem: CartridgeItemService.getAllCartridgeItems,
        ConsumableItem: ConsumableItemService.getAllConsumableItems,
        Cable: CableService.getAllCables,
        DatabaseInstance: DatabaseInstanceService.getAllDatabaseInstances,
        DCRoom: DCRoomService.getAllDCRooms
      };

      // Fetch items for all types
      const itemPromises = elementsListTypes.map(type => 
        safeFetch(serviceMap[type.itemType])
      );

      // Fetch related data
      const [states, locations, manufacturers] = await Promise.all([
        safeFetch(StateService.getAllStates),
        safeFetch(LocationService.getAllLocations),
        safeFetch(ManufacturerService.getAllManufacturers)
      ]);

      // Create lookup maps
      const statesMap = {};
      (states || []).forEach(state => statesMap[state.id] = state.name);

      const locationsMap = {};
      (locations || []).forEach(loc => locationsMap[loc.id] = loc.name);

      const manufacturersMap = {};
      (manufacturers || []).forEach(mf => manufacturersMap[mf.id] = mf.name);

      // Wait for all item fetches
      const itemsResults = await Promise.all(itemPromises);

      // Combine all elements with type
      const elements = [];
      elementsListTypes.forEach((type, index) => {
        elements.push(...itemsResults[index].map(item => ({ ...item, type: type.itemType })));
      });

      setRelatedData({
        states: statesMap,
        locations: locationsMap,
        manufacturers: manufacturersMap
      });

      setAllElements(elements);
      setFilteredElements(elements);
    } catch (error) {
      console.error('Error fetching elements:', error);
      setAllElements([]);
      setFilteredElements([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter elements
  useEffect(() => {
    let filtered = [...allElements];

    // Filter by type
    if (filters.type) {
      filtered = filtered.filter(el => el.type === filters.type);
    }

    // Filter by search text (name OR serial)
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      filtered = filtered.filter(el => {
        return (el.name && el.name.toLowerCase().includes(searchLower)) ||
          (el.serial && el.serial.toLowerCase().includes(searchLower));
      });
    }

    // Filter by location
    if (filters.location) {
      filtered = filtered.filter(el => String(el.locations_id) === filters.location);
    }

    // Filter by manufacturer
    if (filters.manufacturer) {
      filtered = filtered.filter(el => String(el.manufacturers_id) === filters.manufacturer);
    }

    setFilteredElements(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [filters, allElements]);

  // Calculate paginated elements
  const getPaginatedElements = () => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredElements.slice(start, end);
  };
  const totalPages = Math.ceil(filteredElements.length / itemsPerPage);

  // Initial load
  useEffect(() => {
    fetchAllElements();
  }, []);

  // Get label for item type
  const getTypeLabel = (type) => {
    const typeObj = ITEM_TYPES.find(t => t.value === type);
    return typeObj ? typeObj.label : type;
  };

  // Get value with fallback
  const getValue = (value, id, map) => {
    if (value) return value;
    if (id && map[id]) return map[id];
    return '-';
  };

  return (
    <FrontOfficeLayout>
      <div className="frontoffice-page elements-page">
        <h1>Recherche multi-critères</h1>
        
        <div className="filters-section">
          <div className="filter-group">
            <Filter size={16} />
            <label>Type d'élément</label>
            <select value={filters.type} onChange={(e) => setFilters({...filters, type: e.target.value})}>
              {ITEM_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <Search size={16} />
            <label>Recherche (Nom / Numéro de série)</label>
            <input
              type="text"
              placeholder="Rechercher..."
              value={filters.searchText}
              onChange={(e) => setFilters({...filters, searchText: e.target.value})}
            />
          </div>
          
          <div className="filter-group">
            <Filter size={16} />
            <label>Emplacement</label>
            <select value={filters.location} onChange={(e) => setFilters({...filters, location: e.target.value})}>
              <option value="">Tous les emplacements</option>
              {Object.entries(relatedData.locations).map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <Filter size={16} />
            <label>Fabricant / Éditeur</label>
            <select value={filters.manufacturer} onChange={(e) => setFilters({...filters, manufacturer: e.target.value})}>
              <option value="">Tous les fabricants</option>
              {Object.entries(relatedData.manufacturers).map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="results-table-container">
          {loading ? (
            <div className="loading-state">Chargement des éléments...</div>
          ) : (
            <>
              <table className="elements-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Type d'élément</th>
                    <th>Nom</th>
                    <th>Numéro de Série / Clé</th>
                    <th>Fabricant / Éditeur</th>
                    <th>Emplacement</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {getPaginatedElements().length > 0 ? (
                    getPaginatedElements().map((element) => (
                      <tr key={`${element.type}-${element.id}`}>
                        <td>{element.id}</td>
                        <td>{getTypeLabel(element.type)}</td>
                        <td>{element.name || '-'}</td>
                        <td>{element.serial || element.otherserial || '-'}</td>
                        <td>{getValue(relatedData.manufacturers[element.manufacturers_id], element.manufacturers_id, relatedData.manufacturers)}</td>
                        <td>{getValue(relatedData.locations[element.locations_id], element.locations_id, relatedData.locations)}</td>
                        <td>{getValue(relatedData.states[element.states_id], element.states_id, relatedData.states)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="empty-state">Aucun élément trouvé avec ces critères</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Pagination */}
              {!loading && filteredElements.length > 0 && (
                <div className="pagination-bar" style={{ background: 'white', borderRadius: '12px', marginTop: '16px', padding: '16px' }}>
                  <div className="pagination-info">
                    <select
                      value={itemsPerPage}
                      onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                      className="per-page-select"
                    >
                      <option value={10}>10 éléments / page</option>
                      <option value={20}>20 éléments / page</option>
                      <option value={50}>50 éléments / page</option>
                    </select>
                  </div>
                  <div className="pagination-controls">
                    <button
                      className="pagination-btn"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      Précédent
                    </button>
                    <span className="pagination-info-text">
                      Page {currentPage} sur {totalPages}
                    </span>
                    <button
                      className="pagination-btn"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </FrontOfficeLayout>
  );
};

export default ElementsList;
