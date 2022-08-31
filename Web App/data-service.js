const { Model } = require('sequelize');
const Sequelize = require('sequelize');

//set up sequelize to point to our postgres database
var sequelize = new Sequelize('d274naujl5dplk', 'xqoocssekdjief', 'd326063a4be0e227cb315affb9e7cdb88dd3af60f4145434f1afb2caf9678bfd', {
    host: 'ec2-34-203-182-172.compute-1.amazonaws.com',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: { rejectUnauthorized: false }
    },
    query: {raw:true}
});

// Define the employees model
var Employee = sequelize.define('Employee', {
    employeeNum: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    firstName: Sequelize.STRING,
    lastName: Sequelize.STRING,
    email: Sequelize.STRING,
    SSN: Sequelize.STRING,
    addressStreet: Sequelize.STRING,
    addressCity: Sequelize.STRING,
    addressState: Sequelize.STRING,
    addressPostal: Sequelize.STRING,
    maritalStatus: Sequelize.STRING,
    isManager: Sequelize.BOOLEAN,
    employeeManagerNum: Sequelize.INTEGER,
    status: Sequelize.STRING,
    hireDate: Sequelize.STRING
});

// Define the department model
var Department = sequelize.define('Department', {
    departmentId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    departmentName: Sequelize.STRING
});

// declare constraints
Department.hasMany(Employee, { foreignKey: 'department' });

module.exports.initialize = function () {
    return new Promise(function (resolve, reject) {
        sequelize.sync().then(() => {
            resolve();
        }).catch(() => {
            reject("Unable to sync with the database!");
        });
    });
}

module.exports.getAllEmployees = function () {
    return new Promise(function (resolve, reject) {
        Employee.findAll({
            order: ["employeeNum"]
        }).then((data) => {
            resolve(data);
        }).catch(() => {
            reject("No results returned!");
        });
    });
}

module.exports.getManagers = function () {
    return new Promise(function (resolve, reject) {
        Employee.findAll({
            where: { isManager: true }
        }).then((data) => {
            resolve(data);
        }).catch(() => {
            reject("No results returned!");
        })
    });
}

module.exports.getEmployeesByStatus = function (emp_status) {
    return new Promise(function (resolve, reject) {
        Employee.findAll({
            where: { status: emp_status }
        }).then((data) => {
            resolve(data);
        }).catch(() => {
            reject("No results returned!");
        });
    });
}

module.exports.getEmployeesByDepartment = function (emp_department) {
    return new Promise(function (resolve, reject) {
        Employee.findAll({
            where: { department: emp_department }
        }).then((data) => {
            resolve(data);
        }).catch(() => {
            reject("No results returned!");
        });
    });
}

module.exports.getEmployeesByManager = function (emp_manager) {
    return new Promise(function (resolve, reject) {
        Employee.findAll({
            where: { employeeManagerNum: emp_manager }
        }).then((data) => {
            resolve(data);
        }).catch(() => {
            reject("No results returned!");
        });
    });
}

module.exports.getEmployeeByNum = function (num) {
    return new Promise(function (resolve, reject) {
        Employee.findAll({
            where: { employeeNum: num },
        }).then((data) => {
            resolve(data[0]);
        }).catch(() => {
            reject("No results returned!");
        });
    });
}

module.exports.addEmployee = function (employeeData) {
    return new Promise((resolve, reject) => {
        employeeData.isManager = (employeeData.isManager) ? true : false;
        // for..in loop
        for (const attributes in employeeData) {
            if (employeeData[attributes] == "") {
                employeeData[attributes] = null;
            }
        }
        Employee.create(employeeData)
            .then((data) => {
                resolve(data);
            }).catch((err) => {
                reject("Unable to add Employee");
            });
    });
}

module.exports.updateEmployee = function (employeeData) {
    return new Promise((resolve, reject) => {
        employeeData.isManager = (employeeData.isManager) ? true : false;
        // for..in loop
        for (const attributes in employeeData) {
            if (employeeData[attributes] == "") {
                employeeData[attributes] = null;
            }
        }
        Employee.update({
            firstName: employeeData.firstName,
            lastName: employeeData.lastName,
            email: employeeData.email,
            addressStreet: employeeData.addressStreet,
            addressCity: employeeData.addressCity,
            addressState: employeeData.addressState,
            addressPostal: employeeData.addressPostal,
            isManager: employeeData.isManager,
            employeeManagerNum: employeeData.employeeManagerNum,
            status: employeeData.employeeManagerNum,
            department: employeeData.department
        }, { where: { employeeNum: employeeData.employeeNum } })
            .then((data) => {
                resolve(data);
            }).catch((err) => {
                reject("Unable to update Employee");
            });
    })
}

module.exports.deleteEmployeeByNum = function (empNum) {
    return new Promise((resolve, reject) => {
        Employee.destroy({
            where: { employeeNum: empNum }
        }).then((data) => {
            console.log("deleted")
            resolve();
        }).catch(() => {
            reject("Unable to delete Employee");
        });
    });
}

module.exports.getDepartments = function () {
    return new Promise((resolve, reject) => {
        Department.findAll({
            order: ["departmentId"]
        })
        .then((data) => {
            resolve(data);
        }).catch(() => {
            reject("No results returned!");
        })
    });
}

module.exports.addDepartment = function (departmentData) {
    return new Promise((resolve, reject) => {
        for (const attributes in departmentData) {
            if (departmentData[attributes] == "") {
                departmentData[attributes] = null;
            }
        }
        Department.create(departmentData)
            .then((data) => {
                resolve(data);
            }).catch((err) => {
                reject("Unable to add Department!");
            });
    });
}

module.exports.updateDepartment = function (departmentData) {
    return new Promise((resolve, reject) => {
        for (const attributes in departmentData) {
            if (departmentData[attributes] == "") {
                departmentData[attributes] = null;
            }
        }
        Department.update({
            departmentName: departmentData.departmentName
        }, {
            where: {departmentId: departmentData.departmentId}
        }).then((data) => {
            resolve(data[0]);
        }).catch((err) => {
            reject("Unable to update Department!");
        });
    });
}

module.exports.getDepartmentById = function (id) {
    return new Promise((resolve, reject) => {
        Department.findAll({
            where: { departmentId: id }
        }).then((data) => {
            resolve(data);
        }).catch(() => {
            reject("No results returned!");
        });
    });
}

module.exports.deleteDepartmentById = function (id) {
    return new Promise((resolve, reject) => {
        Department.destroy({
            where: { departmentId: id }
        }).then((data) => {
            resolve(data);
        }).catch(() => {
            reject("No results returned!");
        });
    });
}



