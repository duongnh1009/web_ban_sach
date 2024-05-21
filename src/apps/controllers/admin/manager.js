const orderModel = require("../../models/order");
const productModel = require("../../models/product");

// lấy dữ liệu nhập sản phẩm theo ngày và sản phẩm
const getTotalPurchaseByDayAndProduct = async() => {
  try {
    const result = await productModel.aggregate([
      // Đầu tiên, unwind purchaseHistory để làm phẳng mảng
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
            product: "$name",
          },
          totalQuantity: { $sum: "$purchaseHistory.quantity" },
        },
      },
      // Đưa kết quả vào một object mới
      {
        $project: {
          _id: 0,
          day: "$_id.day",
          product: "$_id.product",
          totalQuantity: 1,
        },
      },
      {
        $sort: { date: -1 }, // Sắp xếp theo thời gian giảm dần
      },
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
          status: "Đã giao", // Chỉ lấy các đơn hàng đã giao
        },
      },
      {
        $unwind: "$items", // Tách mỗi mục hàng thành một document riêng biệt
      },
      {
        $match: {
          "items.qty": { $gt: 0 }, // Loại bỏ các mục hàng có số lượng nhỏ hơn hoặc bằng 0
        },
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
        $project: {
          _id: 0,
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
        },
      },
      {
        $sort: { date: -1 }, // Sắp xếp theo thời gian giảm dần
      },
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
      // Match orders with status "Đã giao"
      { $match: { status: "Đã giao" } },
      // Unwind the items array to treat each item as a separate document
      { $unwind: "$items" },
      // Group by product name and sum up the total quantity sold
      {
        $group: {
          _id: "$items.name",
          totalQuantitySold: { $sum: "$items.qty" },
        },
      },
      // Project to reshape the output
      {
        $project: {
          productName: "$_id",
          totalQuantitySold: 1,
          _id: 0,
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
        $unwind: "$purchaseHistory", // "Giải phóng" mỗi mục trong mảng purchaseHistory
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
  // Pie chart
  const generateColors = (numColors) => {
    const colors = [];
    for (let i = 0; i < numColors; i++) {
      // Tạo màu ngẫu nhiên
      const color = `rgb(${Math.floor(Math.random() * 256)}, ${Math.floor(
        Math.random() * 256
      )}, ${Math.floor(Math.random() * 256)})`;
      colors.push(color);
    }
    return colors;
  };

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
          label: "My First Dataset",
          data: quantityRestock,
          backgroundColor: generateColors(nameProductRestock.length),
          hoverOffset: 4,
        },
      ],
    },
  };

  const dataImportProductTable = await getTotalPurchaseByDayAndProduct();
  res.render("admin/manager/import", {
    dataImportProductTable,
    dataRestock,
  });
};

const soldOut = async(req, res) => {
   // Pie chart
   const generateColors = (numColors) => {
    const colors = [];
    for (let i = 0; i < numColors; i++) {
      // Tạo màu ngẫu nhiên
      const color = `rgb(${Math.floor(Math.random() * 256)}, ${Math.floor(
        Math.random() * 256
      )}, ${Math.floor(Math.random() * 256)})`;
      colors.push(color);
    }
    return colors;
  };

  // data pieChart sales
  const dataSalesByProduct = await getProductSales();
  const nameProduct = dataSalesByProduct.map((item) => item.productName);
  const quantitySale = dataSalesByProduct.map((item) => item.totalQuantitySold);
  const PieChart = {
    type: "pie",
    data: {
      labels: nameProduct,
      datasets: [
        {
          label: "My First Dataset",
          data: quantitySale,
          backgroundColor: generateColors(nameProduct.length),
          hoverOffset: 4,
        },
      ],
    },
  };

  const dataSoldProductTable = await getSoldItemsByProductNameAndTime();
  res.render("admin/manager/soldOut", {
    dataSoldProductTable,
    PieChart
  });
}

module.exports = {
  importProduct,
  soldOut
};
