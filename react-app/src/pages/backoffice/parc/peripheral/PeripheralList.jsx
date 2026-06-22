import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import PeripheralService from '../../../../services/Peripheral/PeripheralService';
import StateService from '../../../../services/State/StateService';
import ManufacturerService from '../../../../services/Manufacturer/ManufacturerService';
import LocationService from '../../../../services/Location/LocationService';
import '../../../../styles/list.css';

const PeripheralList = () => {
  const [peripherals, setPeripherals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [relatedData, setRelatedData] = useState({
    states: {},
    manufacturers: {},
    locations: {}
  });

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [
        peripheralsData,
        statesData,
        manufacturersData,
        locationsData
      ] = await Promise.all([
        PeripheralService.getAllPeripherals(),
        StateService.getAllStates(),
        ManufacturerService.getAllManufacturers(),
        LocationService.getAllLocations()
      ]);

      const statesMap = {};
      statesData.forEach(state => statesMap[state.id] = state.name);

      const manufacturersMap = {};
      manufacturersData.forEach(mf => manufacturersMap[mf.id] = mf.name);

      const locationsMap = {};
      locationsData.forEach(loc => locationsMap[loc.id] = loc.name);

      setRelatedData({
        states: statesMap,
        manufacturers: manufacturersMap,
        locations: locationsMap
      });

      setPeripherals(peripheralsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setPeripherals([]);
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
        <h1>Liste des périphériques</h1>
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
                <th>Lieu</th>
                <th>Dernière modification</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {peripherals.length > 0 ? (
                peripherals.map((peripheral) => (
                  <tr key={peripheral.id}>
                    <td>{peripheral.id}</td>
                    <td className="item-name">{peripheral.name || `Périphérique #${peripheral.id}`}</td>
                    <td>{getRelatedName(relatedData.states, peripheral.states_id)}</td>
                    <td>{getRelatedName(relatedData.manufacturers, peripheral.manufacturers_id)}</td>
                    <td>{peripheral.serial || '-'}</td>
                    <td>{getRelatedName(relatedData.locations, peripheral.locations_id)}</td>
                    <td>{formatDate(peripheral.date_mod)}</td>
                    <td className="action-cell">
                      <Link to={`/parc/peripherals/${peripheral.id}`} className="action-btn">
                        <Eye size={16} />
                        Détails
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="empty-state">
                    Aucun périphérique trouvé.
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

export default PeripheralList;