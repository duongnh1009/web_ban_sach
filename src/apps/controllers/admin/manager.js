const orderModel = require("../../models/order");
const productModel = require("../../models/product");

// lấy dữ liệu nhập sản phẩm theo ngày và sản phẩm
const getTotalPurchaseByDayAndProduct = async() => {
  try {
    const result = await productModel.aggregate([
      // tách $purchaseHistory thành những documents riêng biệt
      { $unwind: "$purchaseHistory" },
      // Nhóm theo ngày và slug của sản phẩm, tính tổng quantity
      {
        $group: {
          _id: {
            day: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: { $toDate: "$purchaseHistory.date" },
              },
            },
            product: "$name", // lấy tên sản phẩm
            quantity: "$quantity", // lấy số lượng tồn kho
          },
          totalQuantity: { $sum: "$purchaseHistory.quantity" }, // lấy số lượng nhập
        },
      },
      // Đưa kết quả vào một object mới
      {
        $project: {
          day: "$_id.day",
          product: "$_id.product",
          quantity: "$_id.quantity",
          totalQuantity: 1,
        },
      }
    ]);
    return result;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

// lấy dữ liệu bán sản phẩm theo ngày và sản phẩm
const getSoldItemsByProductNameAndTime = async() => {
  try {
    // Truy vấn số lượng đã bán cho mỗi tên sản phẩm và thời gian
    const soldItemsByProductNameAndTime = await orderModel.aggregate([
      {
        $match: {
          status: "Đã giao hàng", // Chỉ lấy các đơn hàng đã giao
        },
      },
      {
        $unwind: "$items",  // Tách items thành những document riêng biệt
      },
      {
        $group: {
          _id: {
            productName: "$items.name", // Nhóm theo tên sản phẩm
            year: { $year: "$createdAt" }, // Nhóm theo năm
            month: { $month: "$createdAt" }, // Nhóm theo tháng
            day: { $dayOfMonth: "$createdAt" }, // Nhóm theo ngày
          },
          totalQuantity: { $sum: "$items.qty" }, // Tính tổng số lượng đã bán
          productName: { $first: "$items.name" }, // Giữ lại tên sản phẩm
        },
      },
      {
        $lookup: {
          from: "products", // Tên collection chứa thông tin sản phẩm
          localField: "_id.productName", // Trường trong collection hiện tại để so khớp
          foreignField: "name", // Trường trong collection "products" chứa thông tin sản phẩm để so khớp
          as: "productDetails", // Tên của trường chứa kết quả tìm kiếm
        },
      },
      {
        $project: {
          productName: 1,
          date: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: {
                $dateFromParts: {
                  year: "$_id.year",
                  month: "$_id.month",
                  day: "$_id.day",
                },
              },
            },
          },
          totalQuantity: 1,
          "productDetails.quantity": 1, // Bao gồm trường quantity từ kết quả của $lookup
        },
      }
    ]);

    return soldItemsByProductNameAndTime;
  } catch (error) {
    console.error(
      "Lỗi khi tính toán số lượng sản phẩm đã bán theo tên sản phẩm và thời gian:",
      error
    );
    throw error;
  }
};

// tổng số lượng sản phẩm bán ra theo sản phẩm (Pie chart)
const getProductSales = async () => {
  try {
    const productSales = await orderModel.aggregate([
      // lấy các đơn hàng có trạng thái là "Đã giao hàng"
      { $match: { status: "Đã giao hàng" } },
      // tách $items thành những document riêng biệt
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.name", // nhóm các sản phẩm theo tên
          name: { $first: "$items.name" }, // Lấy tên sản phẩm (chỉ cần một lần)
          totalQuantitySold: { $sum: "$items.qty" },
        },
      },
    ]);

    return productSales;
  } catch (error) {
    console.error("Error fetching product sales:", error);
    throw error;
  }
};

// tổng số lượng sản phẩm nhập vào theo sản phẩm (Pie chart)
const getTotalPurchaseHistoryByProduct = async () => {
  try {
    const result = await productModel.aggregate([
      {
        $unwind: "$purchaseHistory", // tách $purchaseHistory thành những documents riêng biệt
      },
      {
        $group: {
          _id: "$_id", // Nhóm các sản phẩm theo _id
          name: { $first: "$name" }, // Lấy tên sản phẩm (chỉ cần một lần)
          totalQuantity: { $sum: "$purchaseHistory.quantity" }, // Tính tổng số lượng
        },
      },
    ]);

    return result;
  } catch (error) {
    console.error(
      "Error occurred while fetching total quantity by product:",
      error
    );
    throw error;
  }
};

const importProduct = async (req, res) => {
  // data pieChart import product
  const dataImportProduct = await getTotalPurchaseHistoryByProduct();
  const nameProductRestock = dataImportProduct.map((item) => item.name);
  const quantityRestock = dataImportProduct.map((item) => item.totalQuantity);
  const dataRestock = {
    type: "pie",
    data: {
      labels: nameProductRestock,
      datasets: [
        {
          label: "Tổng số lượng đã nhập",
          data: quantityRestock,
          backgroundColor: nameProductRestock.length,
        },
      ],
    },
  };

  const dataImportProductTable = await getTotalPurchaseByDayAndProduct();
  //sap xep thoi gian giam dan
  dataImportProductTable.sort((a,b) => {
    return new Date(b.day) - new Date(a.day);
  })
  res.render("admin/manager/import", {
    dataImportProductTable,
    dataRestock,
  });
};

const soldOut = async(req, res) => {
  // data pieChart sales
  const dataSalesByProduct = await getProductSales();
  const nameProduct = dataSalesByProduct.map((item) => item.name);
  const quantitySale = dataSalesByProduct.map((item) => item.totalQuantitySold);
  const PieChart = {
    type: "pie",
    data: {
      labels: nameProduct,
      datasets: [
        {
          label: "Tổng số lượng đã bán",
          data: quantitySale,
          backgroundColor: nameProduct.length,
        },
      ],
    },
  };

  const dataSoldProductTable = await getSoldItemsByProductNameAndTime();
  //sap xep thoi gian giam dan
  dataSoldProductTable.sort((a,b) => {
    return new Date(b.date) - new Date(a.date);
  })
  res.render("admin/manager/soldOut", {
    dataSoldProductTable,
    PieChart
  });
}

module.exports = {
  importProduct,
  soldOut
};
