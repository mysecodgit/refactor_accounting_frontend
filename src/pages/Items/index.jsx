import React, { useEffect, useState, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import TableContainer from "../../components/Common/TableContainer";
import Spinners from "../../components/Common/Spinner";
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
import Breadcrumbs from "/src/components/Common/Breadcrumb";
import DeleteModal from "/src/components/Common/DeleteModal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axiosInstance from "../../services/axiosService";
import moment from "moment/moment";

const Items = () => {
  document.title = "Items";
  const { id: buildingId } = useParams();

  const [item, setItem] = useState();
  const [isLoading, setLoading] = useState(true);
  const [isNewModalOpen, setIsNewModelOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [items, setItems] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [deleteModal, setDeleteModal] = useState(false);

  const itemTypes = [
    { value: "inventory", label: "Inventory" },
    { value: "non inventory", label: "Non Inventory" },
    { value: "service", label: "Service" },
    { value: "discount", label: "Discount" },
    { value: "payment", label: "Payment" },
  ];

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      id: (item && item.id) || "",
      name: (item && item.name) || "",
      type: (item && item.type) || "",
      description: (item && item.description) || "",
      asset_account: (item && item.asset_account?.id) || "",
      income_account: (item && item.income_account?.id) || "",
      cogs_account: (item && item.cogs_account?.id) || "",
      expense_account: (item && item.expense_account?.id) || "",
      on_hand: (item && item.on_hand) || 0,
      avg_cost: (item && item.avg_cost) || 0,
      date: (item && item.date) || moment().format("YYYY-MM-DD"),
      building_id: (item && item.building_id) || (buildingId ? parseInt(buildingId) : ""),
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Please Enter Item Name"),
      type: Yup.string().required("Please Select Item Type").oneOf(["inventory", "non inventory", "service", "discount", "payment"], "Invalid item type"),
      description: Yup.string(),
      asset_account: Yup.number().nullable(),
      income_account: Yup.number().nullable(),
      cogs_account: Yup.number().nullable(),
      expense_account: Yup.number().nullable(),
      on_hand: Yup.number().required("Please Enter On Hand").min(0, "On Hand must be 0 or greater"),
      avg_cost: Yup.number().required("Please Enter Average Cost").min(0, "Average Cost must be 0 or greater"),
      date: Yup.date().required("Please Enter Date"),
      building_id: Yup.number().required("Please Select Building").min(1, "Please Select Building"),
    }),
    onSubmit: async (values) => {
      try {
        const payload = {
          name: values.name,
          type: values.type,
          description: values.description || "",
          asset_account: values.asset_account ? parseInt(values.asset_account) : null,
          income_account: values.income_account ? parseInt(values.income_account) : null,
          cogs_account: values.cogs_account ? parseInt(values.cogs_account) : null,
          expense_account: values.expense_account ? parseInt(values.expense_account) : null,
          on_hand: parseFloat(values.on_hand),
          avg_cost: parseFloat(values.avg_cost),
          date: values.date,
          building_id: parseInt(values.building_id),
        };

        if (isEdit) {
          let url = `items/${values.id}`;
          if (buildingId) {
            url = `v1/buildings/${buildingId}/items/${values.id}`;
          }
          const { data } = await axiosInstance.put(url, payload);
          toast.success("Item updated successfully");
          validation.resetForm();
          setIsNewModelOpen(false);
          fetchItems();
        } else {
          let url = "items";
          if (buildingId) {
            url = `v1/buildings/${buildingId}/items`;
          }
          const { data } = await axiosInstance.post(url, payload);
          toast.success("Item created successfully");
          validation.resetForm();
          setIsNewModelOpen(false);
          fetchItems();
        }
      } catch (err) {
        const errorMsg = err.response?.data?.error || err.response?.data?.errors || "Something went wrong";
        toast.error(typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg);
      }
    },
  });

  const fetchBuildings = async () => {
    try {
      const { data } = await axiosInstance.get("v1/buildings");
      setBuildings(data.data || []);
    } catch (error) {
      console.log("Error fetching buildings", error);
    }
  };

  const fetchAccounts = async () => {
    try {
      let url = "accounts";
      if (buildingId) {
        url = `v1/buildings/${buildingId}/accounts`;
      }
      const { data } = await axiosInstance.get(url);
      setAccounts(data.data || []);
    } catch (error) {
      console.log("Error fetching accounts", error);
    }
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      let url = "items";
      if (buildingId) {
        url = `v1/buildings/${buildingId}/items`;
      }
      const { data } = await axiosInstance.get(url);
      setItems(data.data || []);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast.error("Failed to fetch items");
      console.log("Error ", error);
    }
  };

  useEffect(() => {
    fetchBuildings();
    fetchAccounts();
    fetchItems();
  }, [buildingId]);

  const onDeleteItem = async () => {
    try {
      let url = `v1/items/${item.id}`;
      if (buildingId) {
        url = `v1/buildings/${buildingId}/items/${item.id}`;
      }
      await axiosInstance.delete(url);
      toast.success("Item deleted successfully");
      setDeleteModal(false);
      fetchItems();
    } catch (err) {
      toast.error("Failed to delete item");
      console.log(err);
    }
  };

  const columns = useMemo(
    () => [
      {
        header: "ID",
        accessorKey: "id",
        enableColumnFilter: false,
        enableSorting: true,
      },
      {
        header: "Name",
        accessorKey: "name",
        enableColumnFilter: false,
        enableSorting: true,
      },
      {
        header: "Type",
        accessorKey: "type",
        enableColumnFilter: false,
        enableSorting: true,
      },
      {
        header: "Description",
        accessorKey: "description",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          return <>{cell.row.original.description || "N/A"}</>;
        },
      },
      {
        header: "On Hand",
        accessorKey: "on_hand",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          return <>{parseFloat(cell.row.original.on_hand).toFixed(2)}</>;
        },
      },
      {
        header: "Avg Cost",
        accessorKey: "avg_cost",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          return <>{parseFloat(cell.row.original.avg_cost).toFixed(2)}</>;
        },
      },
      {
        header: "Date",
        accessorKey: "date",
        enableColumnFilter: false,
        enableSorting: true,
      },
      // {
      //   header: "Building",
      //   accessorKey: "building.name",
      //   enableColumnFilter: false,
      //   enableSorting: true,
      //   cell: (cell) => {
      //     return <>{cell.row.original.building?.name || "N/A"}</>;
      //   },
      // },
      {
        header: "Action",
        cell: (cellProps) => {
          return (
            <div className="d-flex gap-3">
              <Link
                to="#"
                className="text-success"
                onClick={() => {
                  setIsEdit(true);
                  const itemData = cellProps.row.original;
                  setItem(itemData);
                  setIsNewModelOpen(true);
                }}
              >
                <i className="mdi mdi-pencil font-size-18" />
              </Link>
              <Link
                to="#"
                className="text-danger"
                onClick={() => {
                  const itemData = cellProps.row.original;
                  setItem(itemData);
                  setDeleteModal(true);
                }}
              >
                <i className="mdi mdi-delete font-size-18" />
              </Link>
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <React.Fragment>
      <DeleteModal
        show={deleteModal}
        warningText={"Are you sure to delete this item "}
        boldText={item?.name}
        onDeleteClick={() => onDeleteItem()}
        onCloseClick={() => setDeleteModal(false)}
      />
      <div className="page-content">
        <Container fluid>
          <Breadcrumbs title="Items" breadcrumbItem="Items" />
          {isLoading ? (
            <Spinners setLoading={setLoading} />
          ) : (
            <Row>
              <Col lg="12">
                <Card>
                  <CardBody>
                    <TableContainer
                      columns={columns}
                      data={items || []}
                      isGlobalFilter={true}
                      isPagination={false}
                      SearchPlaceholder="Search..."
                      isCustomPageSize={true}
                      isAddButton={true}
                      handleUserClick={() => {
                        setIsEdit(false);
                        setItem("");
                        setIsNewModelOpen(!isNewModalOpen);
                      }}
                      buttonClass="btn btn-success btn-rounded waves-effect waves-light addContact-modal mb-2"
                      buttonName="New Item"
                      tableClass="align-middle table-nowrap table-hover dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
                      theadClass="table-light"
                      paginationWrapper="dataTables_paginate paging_simple_numbers pagination-rounded"
                      pagination="pagination"
                    />
                  </CardBody>
                </Card>
              </Col>
            </Row>
          )}
          <Modal
            isOpen={isNewModalOpen}
            toggle={() => setIsNewModelOpen(!isNewModalOpen)}
            size="lg"
          >
            <ModalHeader
              toggle={() => setIsNewModelOpen(!isNewModalOpen)}
              tag="h4"
            >
              {!!isEdit ? "Edit Item" : "Add Item"}
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
                      <Label>Name</Label>
                      <Input
                        name="name"
                        type="text"
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
                    <div className="mb-3">
                      <Label>Type</Label>
                      <Input
                        name="type"
                        type="select"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.type || ""}
                        invalid={
                          validation.touched.type && validation.errors.type
                            ? true
                            : false
                        }
                      >
                        <option value="">Select Item Type</option>
                        {itemTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </Input>
                      {validation.touched.type && validation.errors.type ? (
                        <FormFeedback type="invalid">
                          {validation.errors.type}
                        </FormFeedback>
                      ) : null}
                    </div>
                    <div className="mb-3">
                      <Label>Description</Label>
                      <Input
                        name="description"
                        type="textarea"
                        rows="3"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.description || ""}
                        invalid={
                          validation.touched.description && validation.errors.description
                            ? true
                            : false
                        }
                      />
                      {validation.touched.description && validation.errors.description ? (
                        <FormFeedback type="invalid">
                          {validation.errors.description}
                        </FormFeedback>
                      ) : null}
                    </div>
                    <div className="mb-3">
                      <Label>Asset Account</Label>
                      <Input
                        name="asset_account"
                        type="select"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.asset_account || ""}
                        invalid={
                          validation.touched.asset_account && validation.errors.asset_account
                            ? true
                            : false
                        }
                      >
                        <option value="">Select Asset Account (Optional)</option>
                        {accounts.map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.account_name} ({account.account_number})
                          </option>
                        ))}
                      </Input>
                      {validation.touched.asset_account && validation.errors.asset_account ? (
                        <FormFeedback type="invalid">
                          {validation.errors.asset_account}
                        </FormFeedback>
                      ) : null}
                    </div>
                    <div className="mb-3">
                      <Label>Income Account</Label>
                      <Input
                        name="income_account"
                        type="select"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.income_account || ""}
                        invalid={
                          validation.touched.income_account && validation.errors.income_account
                            ? true
                            : false
                        }
                      >
                        <option value="">Select Income Account (Optional)</option>
                        {accounts.map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.account_name} ({account.account_number})
                          </option>
                        ))}
                      </Input>
                      {validation.touched.income_account && validation.errors.income_account ? (
                        <FormFeedback type="invalid">
                          {validation.errors.income_account}
                        </FormFeedback>
                      ) : null}
                    </div>
                    <div className="mb-3">
                      <Label>COGS Account</Label>
                      <Input
                        name="cogs_account"
                        type="select"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.cogs_account || ""}
                        invalid={
                          validation.touched.cogs_account && validation.errors.cogs_account
                            ? true
                            : false
                        }
                      >
                        <option value="">Select COGS Account (Optional)</option>
                        {accounts.map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.account_name} ({account.account_number})
                          </option>
                        ))}
                      </Input>
                      {validation.touched.cogs_account && validation.errors.cogs_account ? (
                        <FormFeedback type="invalid">
                          {validation.errors.cogs_account}
                        </FormFeedback>
                      ) : null}
                    </div>
                    <div className="mb-3">
                      <Label>Expense Account</Label>
                      <Input
                        name="expense_account"
                        type="select"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.expense_account || ""}
                        invalid={
                          validation.touched.expense_account && validation.errors.expense_account
                            ? true
                            : false
                        }
                      >
                        <option value="">Select Expense Account (Optional)</option>
                        {accounts.map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.account_name} ({account.account_number})
                          </option>
                        ))}
                      </Input>
                      {validation.touched.expense_account && validation.errors.expense_account ? (
                        <FormFeedback type="invalid">
                          {validation.errors.expense_account}
                        </FormFeedback>
                      ) : null}
                    </div>
                    <div className="mb-3">
                      <Label>On Hand</Label>
                      <Input
                        name="on_hand"
                        type="number"
                        step="0.01"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.on_hand || 0}
                        invalid={
                          validation.touched.on_hand && validation.errors.on_hand
                            ? true
                            : false
                        }
                      />
                      {validation.touched.on_hand && validation.errors.on_hand ? (
                        <FormFeedback type="invalid">
                          {validation.errors.on_hand}
                        </FormFeedback>
                      ) : null}
                    </div>
                    <div className="mb-3">
                      <Label>Average Cost</Label>
                      <Input
                        name="avg_cost"
                        type="number"
                        step="0.01"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.avg_cost || 0}
                        invalid={
                          validation.touched.avg_cost && validation.errors.avg_cost
                            ? true
                            : false
                        }
                      />
                      {validation.touched.avg_cost && validation.errors.avg_cost ? (
                        <FormFeedback type="invalid">
                          {validation.errors.avg_cost}
                        </FormFeedback>
                      ) : null}
                    </div>
                    <div className="mb-3">
                      <Label>Date</Label>
                      <Input
                        name="date"
                        type="date"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.date || ""}
                        invalid={
                          validation.touched.date && validation.errors.date
                            ? true
                            : false
                        }
                      />
                      {validation.touched.date && validation.errors.date ? (
                        <FormFeedback type="invalid">
                          {validation.errors.date}
                        </FormFeedback>
                      ) : null}
                    </div>
                    {!buildingId && (
                      <div className="mb-3">
                        <Label>Building</Label>
                        <Input
                          name="building_id"
                          type="select"
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          value={validation.values.building_id || ""}
                          invalid={
                            validation.touched.building_id && validation.errors.building_id
                              ? true
                              : false
                          }
                        >
                          <option value="">Select Building</option>
                          {buildings.map((building) => (
                            <option key={building.id} value={building.id}>
                              {building.name}
                            </option>
                          ))}
                        </Input>
                        {validation.touched.building_id && validation.errors.building_id ? (
                          <FormFeedback type="invalid">
                            {validation.errors.building_id}
                          </FormFeedback>
                        ) : null}
                      </div>
                    )}
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <div className="text-end">
                      <Button
                        type="submit"
                        color="success"
                        className="save-user"
                      >
                        {!!isEdit ? "Update Item" : "Add Item"}
                      </Button>
                    </div>
                  </Col>
                </Row>
              </Form>
            </ModalBody>
          </Modal>
        </Container>
      </div>
      <ToastContainer />
    </React.Fragment>
  );
};

export default Items;

