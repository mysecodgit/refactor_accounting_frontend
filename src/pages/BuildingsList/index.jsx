import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardBody,
  Col,
  Container,
  Row,
  Modal,
  ModalHeader,
  ModalBody,
  Label,
  FormFeedback,
  Input,
  Form,
  Button,
} from "reactstrap";
import * as Yup from "yup";
import { useFormik } from "formik";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axiosInstance from "../../services/axiosService";
import Spinners from "../../components/Common/Spinner";
import moment from "moment/moment";

const BuildingsList = () => {
  document.title = "Select Building";
  const navigate = useNavigate();

  const [isLoading, setLoading] = useState(true);
  const [isNewModalOpen, setIsNewModelOpen] = useState(false);
  const [buildings, setBuildings] = useState([]);

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: "",
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Please Enter Building Name"),
    }),
    onSubmit: async (values) => {
      try {
        const { data } = await axiosInstance.post("v1/buildings", {
          name: values.name,
        });
        toast.success("Building created successfully");
        validation.resetForm();
        setIsNewModelOpen(false);
        fetchBuildings();
      } catch (err) {
        const errorMsg =
          err.response?.data?.error ||
          err.response?.data?.errors ||
          "Something went wrong";
        toast.error(
          typeof errorMsg === "object" ? JSON.stringify(errorMsg) : errorMsg
        );
      }
    },
  });

  const fetchBuildings = async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get("v1/buildings");
      setBuildings(data.data || []);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast.error("Failed to fetch buildings");
      console.log("Error ", error);
    }
  };

  useEffect(() => {
    fetchBuildings();
  }, []);

  const handleBuildingClick = (buildingId) => {
    navigate(`/building/${buildingId}/dashboard`);
  };

  return (
    <React.Fragment>
      <div className="page-content" style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
        <Container fluid className="py-5">
          <Row className="justify-content-center">
            <Col lg={10} xl={8}>
              <div className="text-center mb-5">
                <h2 className="mb-2">Select a Building</h2>
                <p className="text-muted">
                  Choose a building to manage or create a new one
                </p>
              </div>

              {isLoading ? (
                <div className="text-center">
                  <Spinners setLoading={setLoading} />
                </div>
              ) : (
                <>
                  <Row className="g-4 mb-4">
                    {buildings.map((building) => (
                      <Col key={building.id} md={6} lg={4}>
                        <Card
                          className="h-100 shadow-sm building-card"
                          style={{
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                            border: "1px solid #e9ecef",
                          }}
                          onClick={() => handleBuildingClick(building.id)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-5px)";
                            e.currentTarget.style.boxShadow =
                              "0 4px 12px rgba(0,0,0,0.15)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
                          }}
                        >
                          <CardBody className="p-4">
                            <div className="d-flex align-items-center mb-3">
                              <div
                                className="flex-shrink-0 me-3"
                                style={{
                                  width: "48px",
                                  height: "48px",
                                  borderRadius: "12px",
                                  backgroundColor: "#405189",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "white",
                                  fontSize: "24px",
                                  fontWeight: "bold",
                                }}
                              >
                                {building.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-grow-1">
                                <h5 className="mb-0">{building.name}</h5>
                                <small className="text-muted">
                                  {moment(building.created_at).format("MMM YYYY")}
                                </small>
                              </div>
                            </div>
                            <div className="text-end">
                              <i className="mdi mdi-chevron-right text-primary"></i>
                            </div>
                          </CardBody>
                        </Card>
                      </Col>
                    ))}

                    {/* Add New Building Card */}
                    <Col md={6} lg={4}>
                      <Card
                        className="h-100 shadow-sm"
                        style={{
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                          border: "2px dashed #dee2e6",
                          backgroundColor: "#f8f9fa",
                        }}
                        onClick={() => setIsNewModelOpen(true)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "#405189";
                          e.currentTarget.style.backgroundColor = "#f0f4ff";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "#dee2e6";
                          e.currentTarget.style.backgroundColor = "#f8f9fa";
                        }}
                      >
                        <CardBody className="p-4 d-flex flex-column align-items-center justify-content-center" style={{ minHeight: "120px" }}>
                          <div
                            style={{
                              width: "48px",
                              height: "48px",
                              borderRadius: "50%",
                              backgroundColor: "#405189",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "white",
                              fontSize: "24px",
                              marginBottom: "12px",
                            }}
                          >
                            <i className="mdi mdi-plus"></i>
                          </div>
                          <h6 className="mb-0 text-primary">Create New Building</h6>
                        </CardBody>
                      </Card>
                    </Col>
                  </Row>
                </>
              )}
            </Col>
          </Row>
        </Container>

        {/* Create Building Modal */}
        <Modal
          isOpen={isNewModalOpen}
          toggle={() => setIsNewModelOpen(!isNewModalOpen)}
        >
          <ModalHeader
            toggle={() => setIsNewModelOpen(!isNewModalOpen)}
            tag="h4"
          >
            Create New Building
          </ModalHeader>
          <ModalBody>
            <Form
              onSubmit={(e) => {
                e.preventDefault();
                validation.handleSubmit();
                return false;
              }}
            >
              <Row>
                <Col xs={12}>
                  <div className="mb-3">
                    <Label>Building Name</Label>
                    <Input
                      name="name"
                      type="text"
                      placeholder="Enter building name"
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.name || ""}
                      invalid={
                        validation.touched.name && validation.errors.name
                          ? true
                          : false
                      }
                    />
                    {validation.touched.name && validation.errors.name ? (
                      <FormFeedback type="invalid">
                        {validation.errors.name}
                      </FormFeedback>
                    ) : null}
                  </div>
                </Col>
              </Row>
              <Row>
                <Col>
                  <div className="text-end">
                    <Button
                      type="button"
                      color="secondary"
                      className="me-2"
                      onClick={() => setIsNewModelOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" color="primary">
                      Create Building
                    </Button>
                  </div>
                </Col>
              </Row>
            </Form>
          </ModalBody>
        </Modal>
      </div>
      <ToastContainer />
    </React.Fragment>
  );
};

export default BuildingsList;

