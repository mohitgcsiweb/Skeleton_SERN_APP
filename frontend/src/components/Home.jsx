import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { Card, Row, Col, Container } from "react-bootstrap";
import { toast } from "react-toastify";
const apiUrl = import.meta.env.VITE_API_URL;

const Home = () => {
  const [tiles, setTiles] = useState([]);
  const userData = localStorage.getItem("userData");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTiles = async () => {
      try {
        if (userData) {
          const audienceId = JSON.parse(userData).audience._id;
          const response = await axios.get(
            `${apiUrl}/auth/tiles/${audienceId}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );
          setTiles(response.data.tiles);
        }
      } catch (error) {
        if (error.response && error.response.status === 401) {
          navigate("/logout");
        } else {
          toast.error(error.response.data.message || "Fetching tiles failed");
        }
      }
    };

    fetchTiles();
  }, [userData]);

  return (
    <Container>
      {tiles && tiles.length > 1 ? (
        <Row className="mt-3">
          {tiles.map((tile) => (
            <Col md={4} className="mt-3" key={tile._id}>
              <Card style={{ minHeight: "10rem" }}>
                <Card.Body className="text-center align-content-center">
                  <h4>{tile.name}</h4>
                  <Link to={tile.url} className="stretched-link"></Link>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Row className="mt-3">
          {tiles.map((tile) => (
            <Navigate key={tile._id} to={tile.url} />
          ))}
        </Row>
      )}
    </Container>
  );
};

export default Home;
