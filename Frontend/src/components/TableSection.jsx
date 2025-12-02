import React from 'react';

const TableSection = ({ containerId, title, data, columns, emptyMessage }) => {
  return (
    <>
      <h3 className="page_headi">{title}</h3>
      
      {/* This ID allows your CSS (#ongoing_fund, #upcoming_ev) to work */}
      <div id={containerId}>
        {data.length === 0 ? (
          <div className="no-data">{emptyMessage}</div>
        ) : (
          <table>
            <thead>
              {/* Only show header row if columns are provided */}
              {columns && columns.length > 0 && (
                <tr>
                  {columns.map((col, index) => <th key={index}>{col}</th>)}
                </tr>
              )}
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={index}>
                  {/* Logic to handle 'fundraiser_name' vs 'event_name' automatically */}
                  <td>{item.fundraiser_name || item.event_name}</td>
                  
                  {/* Show date/deadline if it exists and we have a 2nd column */}
                  {(item.deadline || item.event_date) && (
                    <td>{item.deadline || item.event_date}</td>
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