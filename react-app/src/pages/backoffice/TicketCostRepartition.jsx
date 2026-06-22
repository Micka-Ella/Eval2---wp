import React, { useState, useEffect } from 'react';
import TicketCostService from '../../services/TicketCost/TicketCostService';
import ItemTicketService from '../../services/ItemTicket/ItemTicketService';

import { Calculator, LayoutList } from 'lucide-react';
import '../../styles/TicketCostRepartition.css';

const TicketCostRepartition = () => {
  const [elements, setElements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState(new Set());

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);

        // 1. Fetch all item-ticket relations
        const itemTickets = await ItemTicketService.getAllItemTickets();
        
        // Count elements per ticket to divide costs equally
        const elementsCountPerTicket = {};
        itemTickets.forEach(link => {
          const tId = Number(link.tickets_id);
          if (!elementsCountPerTicket[tId]) {
            elementsCountPerTicket[tId] = 0;
          }
          elementsCountPerTicket[tId]++;
        });

        // 2. Fetch all regular costs from GLPI
        const allCosts = await TicketCostService.getAllCosts();
        const costPerTicket = {};
        allCosts.forEach(cost => {
          const tId = Number(cost.tickets_id);
          const costFixed = parseFloat(cost.cost_fixed || 0);
          const costMaterial = parseFloat(cost.cost_material || 0);
          const hourlyRate = parseFloat(cost.cost_time || 0);
          const durationHours = (parseInt(cost.actiontime) || 0) / 3600;
          const timeCost = durationHours * hourlyRate;
          const total = costFixed + costMaterial + timeCost;

          if (!costPerTicket[tId]) {
            costPerTicket[tId] = { coutFixe: 0, coutTotal: 0 };
          }
          costPerTicket[tId].coutFixe += costFixed;
          costPerTicket[tId].coutTotal += total;
        });

        // 3. Fetch all super costs from Express backend
        let allSuperCosts = [];
        try {
          allSuperCosts = await TicketCostService.getAllSuperCosts();
        } catch (err) {
          console.warn('Erreur lors de la récupération des Super Costs', err);
        }

        const superCostPerTicket = {};
        allSuperCosts.forEach(sc => {
          const tId = Number(sc.ticket_id);
          if (!superCostPerTicket[tId]) superCostPerTicket[tId] = 0;
          superCostPerTicket[tId] += parseFloat(sc.super_cost || 0);
        });

        // 3.5 Fetch all reopen costs from Express backend
        let allReopenCosts = [];
        try {
          allReopenCosts = await TicketCostService.getAllReopenCosts();
        } catch (err) {
          console.warn('Erreur lors de la récupération des Reopen Costs', err);
        }

        const reopenCostPerTicket = {};
        allReopenCosts.forEach(rc => {
          const tId = Number(rc.ticket_id);
          if (!reopenCostPerTicket[tId]) reopenCostPerTicket[tId] = 0;
          reopenCostPerTicket[tId] += parseFloat(rc.reopen_cost || 0);
        });

        // 4. Calculate total costs per element
        const elementsMap = {};

        itemTickets.forEach(link => {
          const tId = Number(link.tickets_id);
          const itemId = link.items_id;
          const itemType = link.itemtype;
          
          // Unique key for the element
          const elementKey = `${itemType}_${itemId}`;
          
          if (!elementsMap[elementKey]) {
            elementsMap[elementKey] = {
              id: itemId,
              type: itemType,
              name: link.item?.name || `Élément #${itemId}`,
              coutFixe: 0,
              coutTotal: 0,
              superCost: 0,
              reopenCost: 0
            };
          }

          const numElementsInThisTicket = elementsCountPerTicket[tId] || 1;
          
          // Add proportion of ticket costs
          if (costPerTicket[tId]) {
            elementsMap[elementKey].coutFixe += (costPerTicket[tId].coutFixe / numElementsInThisTicket);
            elementsMap[elementKey].coutTotal += (costPerTicket[tId].coutTotal / numElementsInThisTicket);
          }
          
          if (superCostPerTicket[tId]) {
            elementsMap[elementKey].superCost += (superCostPerTicket[tId] / numElementsInThisTicket);
          }
          
          if (reopenCostPerTicket[tId]) {
            elementsMap[elementKey].reopenCost += (reopenCostPerTicket[tId] / numElementsInThisTicket);
          }
        });

        // Convert map to array and sort by type then name
        const elementsArray = Object.values(elementsMap).sort((a, b) => {
          if (a.type !== b.type) return a.type.localeCompare(b.type);
          return a.name.localeCompare(b.name);
        });

        setElements(elementsArray);

      } catch (error) {
        console.error('Erreur lors du calcul de la répartition globale:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const totalGlpi = elements.reduce((acc, el) => acc + el.coutTotal, 0);
  const totalSuper = elements.reduce((acc, el) => acc + el.superCost, 0);
  const totalReopen = elements.reduce((acc, el) => acc + el.reopenCost, 0);
  const grandTotal = totalGlpi + totalSuper + totalReopen;

  // Grouping items by category (type)
  const grouped = {};
  elements.forEach(el => {
    if (!grouped[el.type]) {
      grouped[el.type] = {
        type: el.type,
        coutFixe: 0,
        coutTotal: 0,
        superCost: 0,
        reopenCost: 0,
        items: []
      };
    }
    grouped[el.type].coutFixe += el.coutFixe;
    grouped[el.type].coutTotal += el.coutTotal;
    grouped[el.type].superCost += el.superCost;
    grouped[el.type].reopenCost += el.reopenCost;
    grouped[el.type].items.push(el);
  });

  const categoriesArray = Object.values(grouped).sort((a, b) => a.type.localeCompare(b.type));

  const toggleCategory = (type) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  return (
    <div className="cost-repartition-container">
      <div className="repartition-header">
        <h1 className="repartition-title">
          <Calculator size={32} className="title-icon" />
          Répartition Globale des Coûts par Élément
        </h1>
        <p style={{ color: '#64748b', marginTop: '12px', fontSize: '1rem' }}>
          Ce tableau liste tous les éléments liés à des tickets et affiche la somme de leurs coûts proportionnels (coût du ticket divisé par le nombre d'éléments liés).
        </p>
      </div>

      <div className="repartition-card">
        {loading ? (
          <div className="repartition-loading">Calcul de la répartition globale des coûts...</div>
        ) : elements.length === 0 ? (
          <div className="repartition-empty">
            <LayoutList size={48} className="repartition-empty-icon" />
            <h3>Aucun élément lié trouvé</h3>
            <p>Il semble qu'aucun ticket avec des coûts ne possède d'éléments liés dans le système.</p>
          </div>
        ) : (
          <>
            <h2 className="repartition-section-title">Liste des éléments et leurs coûts cumulés</h2>
            <div className="repartition-table-container">
              <table className="repartition-table">
                <thead>
                  <tr>
                    <th>Type (Catégorie)</th>
                    <th>Nombre de produits</th>
                    <th>Coût Total(GLPI)</th>
                    <th>Super Cost Total</th>
                    <th>Coût Réouverture</th>
                    <th>Somme</th>
                  </tr>
                </thead>
                <tbody>
                  {categoriesArray.map((cat) => {
                    const somme = cat.coutTotal + cat.superCost + cat.reopenCost;
                    const isExpanded = expandedCategories.has(cat.type);
                    return (
                      <React.Fragment key={cat.type}>
                        <tr 
                          onClick={() => toggleCategory(cat.type)} 
                          style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                          className={`category-row ${isExpanded ? 'is-expanded' : ''}`}
                        >
                          <td style={{ fontWeight: 600 }}>
                            <span style={{ 
                              marginRight: '8px', 
                              display: 'inline-block', 
                              color: '#3b82f6', 
                              transition: 'transform 0.2s', 
                              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' 
                            }}>
                              ▶
                            </span>
                            <span className="item-type">{cat.type}</span>
                          </td>
                          <td style={{ color: '#64748b' }}>{cat.items.length} produit(s)</td>
                          <td>
                            <span className="cost-badge green">
                              {cat.coutTotal > 0 ? cat.coutTotal.toFixed(3) : '-'}
                            </span>
                          </td>
                          <td>
                            <span className="cost-badge purple">
                              {cat.superCost > 0 ? cat.superCost.toFixed(3) : '-'}
                            </span>
                          </td>
                          <td>
                            <span className="cost-badge" style={{ backgroundColor: '#fdf4ff', color: '#c026d3', border: '1px solid #f0abfc' }}>
                              {cat.reopenCost > 0 ? cat.reopenCost.toFixed(3) : '-'}
                            </span>
                          </td>
                          <td>
                            <span className="cost-badge" style={{ backgroundColor: '#f8fafc', color: '#0f172a', border: '1px solid #94a3b8', fontWeight: 'bold' }}>
                              {somme > 0 ? somme.toFixed(3) : '-'}
                            </span>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="details-row">
                            <td colSpan="6" style={{ padding: '12px 24px', backgroundColor: '#f8fafc' }}>
                              <div className="details-container" style={{ borderLeft: '4px solid #3b82f6', paddingLeft: '16px', paddingBottom: '8px' }}>
                                <h4 style={{ margin: '0 0 12px 0', color: '#1e293b', fontSize: '0.95rem', fontWeight: 600 }}>
                                  Détails des produits pour la catégorie {cat.type}
                                </h4>
                                <table className="details-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                  <thead>
                                    <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                                      <th style={{ padding: '8px 12px', fontWeight: 600 }}>Nom du produit</th>
                                      <th style={{ padding: '8px 12px', fontWeight: 600 }}>Coût GLPI</th>
                                      <th style={{ padding: '8px 12px', fontWeight: 600 }}>Super Cost</th>
                                      <th style={{ padding: '8px 12px', fontWeight: 600 }}>Coût Réouverture</th>
                                      <th style={{ padding: '8px 12px', fontWeight: 600 }}>Somme</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {cat.items.map((item, idx) => {
                                      const itemSomme = item.coutTotal + item.superCost + item.reopenCost;
                                      return (
                                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                          <td style={{ padding: '8px 12px', fontWeight: 700, color: '#0f172a' }}>{item.name}</td>
                                          <td style={{ padding: '8px 12px' }}>
                                            <span style={{ color: '#16a34a', fontWeight: 600 }}>
                                              {item.coutTotal > 0 ? item.coutTotal.toFixed(3) : '-'}
                                            </span>
                                          </td>
                                          <td style={{ padding: '8px 12px' }}>
                                            <span style={{ color: '#9333ea', fontWeight: 600 }}>
                                              {item.superCost > 0 ? item.superCost.toFixed(3) : '-'}
                                            </span>
                                          </td>
                                          <td style={{ padding: '8px 12px' }}>
                                            <span style={{ color: '#c026d3', fontWeight: 600 }}>
                                              {item.reopenCost > 0 ? item.reopenCost.toFixed(3) : '-'}
                                            </span>
                                          </td>
                                          <td style={{ padding: '8px 12px', fontWeight: 800, color: '#0f172a' }}>
                                            {itemSomme > 0 ? itemSomme.toFixed(3) : '-'}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: '#e2e8f0' }}>
                    <td colSpan="2" style={{ textAlign: 'right', fontWeight: 'bold', paddingRight: '20px', color: '#1e293b', fontSize: '1.1rem' }}>Total général</td>
                    <td>
                      <span className="cost-badge green" style={{ fontWeight: 'bold', fontSize: '1rem' }}>
                        {totalGlpi > 0 ? totalGlpi.toFixed(3) : '-'}
                      </span>
                    </td>
                    <td>
                      <span className="cost-badge purple" style={{ fontWeight: 'bold', fontSize: '1rem' }}>
                        {totalSuper > 0 ? totalSuper.toFixed(3) : '-'}
                      </span>
                    </td>
                    <td>
                      <span className="cost-badge" style={{ backgroundColor: '#fdf4ff', color: '#c026d3', border: '1px solid #f0abfc', fontWeight: 'bold', fontSize: '1rem' }}>
                        {totalReopen > 0 ? totalReopen.toFixed(3) : '-'}
                      </span>
                    </td>
                    <td>
                      <span className="cost-badge" style={{ backgroundColor: '#0f172a', color: '#ffffff', border: '1px solid #0f172a', fontWeight: 'bold', fontSize: '1rem' }}>
                        {grandTotal > 0 ? grandTotal.toFixed(3) : '-'}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TicketCostRepartition;
