import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import ComputerService from '../../../../services/Computer/ComputerService';
import StateService from '../../../../services/State/StateService';
import ManufacturerService from '../../../../services/Manufacturer/ManufacturerService';
import LocationService from '../../../../services/Location/LocationService';
import ComputerModelService from '../../../../services/ComputerModel/ComputerModelService';
import ComputerTypeService from '../../../../services/ComputerType/ComputerTypeService';
import OperatingSystemService from '../../../../services/OperatingSystem/OperatingSystemService';
import '../../../../styles/list.css';

const ComputerList = () => {
  const [computers, setComputers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [relatedData, setRelatedData] = useState({
    states: {},
    manufacturers: {},
    locations: {},
    computerModels: {},
    computerTypes: {},
    operatingSystems: {}
  });

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch all related data in parallel
      const [
        computersData,
        statesData,
        manufacturersData,
        locationsData,
        computerModelsData,
        computerTypesData,
        operatingSystemsData
      ] = await Promise.all([
        ComputerService.getAllComputers(),
        StateService.getAllStates(),
        ManufacturerService.getAllManufacturers(),
        LocationService.getAllLocations(),
        ComputerModelService.getAllComputerModels(),
        ComputerTypeService.getAllComputerTypes(),
        OperatingSystemService.getAllOperatingSystems()
      ]);

      // Create maps for quick lookup
      const statesMap = {};
      statesData.forEach(state => statesMap[state.id] = state.name);

      const manufacturersMap = {};
      manufacturersData.forEach(mf => manufacturersMap[mf.id] = mf.name);

      const locationsMap = {};
      locationsData.forEach(loc => locationsMap[loc.id] = loc.name);

      const computerModelsMap = {};
      computerModelsData.forEach(model => computerModelsMap[model.id] = model.name);

      const computerTypesMap = {};
      computerTypesData.forEach(type => computerTypesMap[type.id] = type.name);

      const operatingSystemsMap = {};
      operatingSystemsData.forEach(os => operatingSystemsMap[os.id] = os.name);

      setRelatedData({
        states: statesMap,
        manufacturers: manufacturersMap,
        locations: locationsMap,
        computerModels: computerModelsMap,
        computerTypes: computerTypesMap,
        operatingSystems: operatingSystemsMap
      });

      console.log('Computers Data:', computersData);
      console.log('Related Maps:', {
        statesMap, manufacturersMap, locationsMap, computerModelsMap, computerTypesMap, operatingSystemsMap
      });

      setComputers(computersData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setComputers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRelatedName = (map, id) => {
    return id ? map[id] || '-' : '-';
  };

  return (
    <div className="parc-list-page">
      <div className="page-header">
        <h1>Liste des ordinateurs</h1>
      </div>

      <div className="parc-table-container">
        {loading ? (
          <div className="loading-state">Chargement...</div>
        ) : (
          <table className="parc-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nom</th>
                <th>Statut</th>
                <th>Fabricant</th>
                <th>Numéro de série</th>
                <th>Type</th>
                <th>Modèle</th>
                <th>Système d'exploitation - Nom</th>
                <th>Lieu</th>
                <th>Dernière modification</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {computers.length > 0 ? (
                computers.map((computer) => (
                  <tr key={computer.id}>
                    <td>{computer.id}</td>
                    <td className="item-name">{computer.name || `Ordinateur #${computer.id}`}</td>
                    <td>{getRelatedName(relatedData.states, computer.states_id)}</td>
                    <td>{getRelatedName(relatedData.manufacturers, computer.manufacturers_id)}</td>
                    <td>{computer.serial || '-'}</td>
                    <td>{getRelatedName(relatedData.computerTypes, computer.computertypes_id)}</td>
                    <td>{getRelatedName(relatedData.computerModels, computer.computermodels_id)}</td>
                    <td>{getRelatedName(relatedData.operatingSystems, computer.operatingsystems_id)}</td>
                    <td>{getRelatedName(relatedData.locations, computer.locations_id)}</td>
                    <td>{formatDate(computer.date_mod)}</td>
                    <td className="action-cell">
                      <Link to={`/parc/computers/${computer.id}`} className="action-btn">
                        <Eye size={16} />
                        Détails
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="11" className="empty-state">
                    Aucun ordinateur trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ComputerList;
