import React from 'react';

const TableSection = ({ containerId, title, data, columns, emptyMessage, onRowClick }) => {
  return (
    <>
      <h3 className="page_headi">{title}</h3>
      <div id={containerId}>
        {data.length === 0 ? (
          <div className="no-data">{emptyMessage}</div>
        ) : (
          <table>
            <thead>
              <tr>
                {/* Dynamically renders only the necessary columns */}
                {columns.map((col, index) => (
                  <th key={index} className={col.toLowerCase().includes('date') ? 'midway-col' : ''}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={index} onClick={() => onRowClick(item)} className="clickable-row">
                  <td>{item.fundraiser_name || item.event_name}</td>
                  
                  {/* Centered Date midway */}
                  <td className="midway-col">
                    {item.deadline || item.event_date
                      ? new Date(item.deadline || item.event_date).toLocaleDateString()
                      : "N/A"}
                  </td>

                  {/* Category Tag remains as the third column if defined */}
                  {columns.length > 2 && (
                    <td className="midway-col">
                      <span className={`tag ${item.fundraiser_name ? 'tag-fund' : 'tag-event'}`}>
                        {item.fundraiser_name ? 'Fundraiser' : 'Event'}
                      </span>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
};

export default TableSection;