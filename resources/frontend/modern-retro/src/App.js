import React, { useState, useEffect } from 'react';
import './App.css';

function LoadingOverlay() {
    return (
        <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <div className="loading-text">Waiting for AI to do it's thing</div>
        </div>
    );
}

function Modal({ data, onClose }) {
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-item">
                  <table>
                    <tr>
                      <td>Name: </td>
                      <td>{data.name}</td>
                    </tr>
                  </table>
                  <button onClick={() => copyToClipboard(data.name)}>Copy Name</button>
                </div>
                <div className="modal-item">
                  <table>
                    <tr>
                      <td>Description: </td>
                      <td>{data.description}</td>
                    </tr>
                  </table>
                  <button onClick={() => copyToClipboard(data.description)}>Copy Description</button>
                </div>
                <button className="close-button" onClick={onClose}>Close</button>
            </div>
        </div>
    );
}



function App() {
    const [data, setData] = useState([]);
    const [genData, setGenData] = useState({name:"", description:""});
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        document.title = "Yabadabado"
        // Replace with your API Gateway URL
        const apiUrl = 'https://5ke3ws3xea.execute-api.us-west-2.amazonaws.com/prod/software';
        fetchData(apiUrl, setData)
    }, []);

    const fetchData = (url, setDataFunction) => {
      setLoading(true);
      return fetch(url)
          .then((response) => {
              if (!response.ok) {
                  throw new Error('Network response was not ok');
              }
              return response.json();
          })
          .then((fetchedData) => {
              setDataFunction(fetchedData);
              setLoading(false);
          })
          .catch((error) => {
              setError(error);
              setLoading(false);
          });
    }

    const handleRowClick = (description) => {
      const genUrl = 'https://5ke3ws3xea.execute-api.us-west-2.amazonaws.com/prod/software/generate';
      
      setLoading(true);
      fetch(genUrl, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ description }), // Sending description as a JSON object
      })
      .then((response) => {
          if (!response.ok) {
              throw new Error('Network response was not ok');
          }
          return response.json();
      })
      .then((fetchedData) => {
          console.log("Fetched data based on clicked row:", fetchedData);
          // Process the fetched data, e.g., appending to a list, displaying in a modal, etc.
          setLoading(false);
          setGenData(fetchedData);
          setShowModal(true);
      })
      .catch((error) => {
          setError(error);
          setLoading(false);
      });
    };

    //if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error.message}</p>;

    return (
        <div className="App">
            { loading && <LoadingOverlay />}
            {showModal && 
                <Modal 
                    data={genData} 
                    onClose={() => setShowModal(false)} 
                />
            }
            <p>This application will take an AWS service of your choice, and provide you with a <b>name</b> and a <b>description</b> of a <i>fictional</i> enterprise software solution from the late 1980s that is sort-of equivalent to it. All thanks to the ✨magic ✨ of <a href="https://aws.amazon.com/bedrock/">Amazon Bedrock</a></p>
          <h2>Choose an AWS Service:</h2>
            <table>
            <thead>
              <tr>
                <th>Service Name</th>
                <th>Service Description</th>
              </tr>
            </thead>
            <tbody>
            {data.map((item, index) => (
                <tr key={index} onClick={() => handleRowClick(item.description)}>
                    <td><b>{item.name}</b></td> 
                    <td><i>{item.description}</i></td>
                </tr>
            ))}
            </tbody>
            </table>
        </div>
    );
}

export default App;

