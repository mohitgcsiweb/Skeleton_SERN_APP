import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button, Form, Card, Row, Col, Container } from "react-bootstrap";
import Select from "react-select";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
const apiUrl = import.meta.env.VITE_API_URL;

const ManageTiles = () => {
  const [audiences, setAudiences] = useState([]);
  const [selectedAudienceId, setSelectedAudienceId] = useState("");
  const [selectedAudience, setSelectedAudience] = useState("");
  const [tiles, setTiles] = useState([]);
  const [audienceTiles, setAudienceTiles] = useState([]);
  const [selectedAudienceIsAdmin, setSelectedAudienceIsAdmin] = useState(false);
  let options = [];
  audiences.map((audience) =>
    options.push({ value: audience._id, label: audience.role })
  );
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAudiences = async () => {
      try {
        const response = await axios.get(`${apiUrl}/admin/audiences`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setAudiences(response.data);
      } catch (error) {
        if (error.response && error.response.status === 401) {
          navigate("/logout");
        } else {
          toast.error(
            error.response.data.message || "Fetching audiences failed"
          );
        }
      }
    };
    const fetchTiles = async () => {
      try {
        const response = await axios.get(`${apiUrl}/admin/tiles`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setTiles(response.data);
      } catch (error) {
        if (error.response && error.response.status === 401) {
          navigate("/logout");
        } else {
          toast.error(error.response.data.message || "Fetching tiles failed");
        }
      }
    };

    fetchAudiences();
    fetchTiles();
  }, []);

  const handleAudienceChange = async (e) => {
    try {
      if (e) {
        const audienceId = e.value;
        setSelectedAudience({ value: audienceId, label: e.label });
        setSelectedAudienceId(audienceId);
        const response = await axios.get(`${apiUrl}/auth/tiles/${audienceId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setAudienceTiles(response.data);
        setSelectedAudienceIsAdmin(
          audiences.find((a) => a._id === audienceId)?.isAdmin || false
        );
      } else {
        setSelectedAudienceId("");
        setAudienceTiles([]);
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        navigate("/logout");
      } else {
        toast.error(
          error.response.data.message || "Fetching tiles by audience failed"
        );
      }
    }
  };

  const handleTileChange = (e) => {
    const tile = JSON.parse(e.target.value);
    const tileId = tile.tileId || tile.id; // This will handle both pre-existing and newly added tiles consistently

    setAudienceTiles((prevTiles) => {
      // Check if the tile is already included in the audienceTiles using both `id` and `tileId`
      const tileExists = prevTiles.some(
        (t) => t.id === tileId || t.tileId === tileId
      );

      let newTiles;
      if (tileExists) {
        // Remove the tile if it exists (uncheck scenario)
        newTiles = prevTiles.filter(
          (t) => t.id !== tileId && t.tileId !== tileId
        );
      } else {
        // Add the tile if it does not exist (check scenario)
        newTiles = [...prevTiles, { ...tile, tileId: tileId }];
      }

      return newTiles;
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const tileIds = audienceTiles.map((a) => a.tileId);
      const response = await axios.put(
        `${apiUrl}/admin/audiences/${selectedAudienceId}`,
        { tiles: tileIds },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      toast.success(response.data.message);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        navigate("/logout");
      } else {
        toast.error(error.response.data.message || "Updating tiles failed");
      }
    }
  };

  return (
    <Container>
      <Card className="mt-3">
        <Card.Header>Manage Tiles</Card.Header>
        <Card.Body>
          <Form>
            <Form.Group className="mb-3 col-md-3">
              <Form.Label htmlFor="audience">Audience</Form.Label>
              <Select
                inputId="audience"
                defaultValue={selectedAudience}
                onChange={handleAudienceChange}
                options={options}
                placeholder="Select audience..."
                autoFocus
                isSearchable
                isClearable
              />
            </Form.Group>
          </Form>
        </Card.Body>
      </Card>
      {selectedAudienceId && (
        <Card className="mt-3">
          <Card.Header>TIles List</Card.Header>
          <Card.Body>
            <Form>
              <Form.Group className="mb-3" controlId="tile">
                {tiles.map((tile) => (
                  <div key={tile.id} className="mb-3">
                    <Form.Check
                      type="checkbox"
                      id={tile.id}
                      value={JSON.stringify(tile)}
                      checked={audienceTiles.some(
                        ({ tileId }) => tileId === tile.id
                      )}
                      label={tile.name}
                      onChange={handleTileChange}
                    />
                  </div>
                ))}
              </Form.Group>
              {!selectedAudienceIsAdmin ? (
                <Button
                  className="btn-block custom-btn col-md mt-3"
                  onClick={handleSave}
                >
                  {" "}
                  Save Changes{" "}
                </Button>
              ) : (
                <></>
              )}
            </Form>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default ManageTiles;
