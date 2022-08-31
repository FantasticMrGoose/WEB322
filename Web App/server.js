const HTTP_PORT = process.env.PORT || 8080;
const express = require("express");
const app = express();
const path = require("path");
const dataService = require('./data-service.js');

const multer = require("multer");
const fs = require("fs")

//require handlebars
const exphbs = require("express-handlebars");

const dataServiceAuth = require('./data-service-auth.js');

const clientSessions = require("client-sessions");

app.engine(".hbs", exphbs({
    extname: ".hbs",
    defaultLayout: 'main',
    helpers: {
        navLink: function (url, options) {
            return '<li' +
                ((url == app.locals.activeRoute) ? ' class="active" ' : '') +
                '><a href="' + url + '">' + options.fn(this) + '</a></li>';
        },
        equal: function (lvalue, rvalue, options) {
            if (arguments.length < 3)
                throw new Error("Handlebars Helper equal needs 2 parameters");
            if (lvalue != rvalue) {
                return options.inverse(this);
            } else {
                return options.fn(this);
            }
        }
    }

}))

app.set('view engine', '.hbs');

// call this function after the http server starts listening for requests
function onHttpStart() {
    console.log("Express http server listening on: " + HTTP_PORT);
}

app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));

const storage = multer.diskStorage({
    destination: "./public/images/uploaded",
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

app.use(function (req, res, next) {
    let route = req.baseUrl + req.path;
    app.locals.activeRoute = (route == "/") ? "/" : route.replace(/\/$/, "");
    next();
});

// Setup client-sessions configuration
app.use(clientSessions({
    cookieName: "session",
    secret: "LunQplmEimZHq0E4SOzrQw==",
    duration: 2 * 60 * 1000,
    activeDuration: 1000 * 60
}));

// Helper middleware
app.use(function (req, res, next) {
    res.locals.session = req.session;
    next();
});

// ensure authentication
function ensureLogin(req, res, next) {
    if (!req.session.user) {
        res.redirect("/login");
    } else {
        next();
    }
}

// setup a 'route' to listen on the default url path (http://localhost)
app.get("/", (req, res) => {
    res.render('home', {});
});

app.get("/about", (req, res) => {
    res.render('about', {});
});

// route to a Form to add employee
app.get("/employees/add", ensureLogin, (req, res) => {
    dataService.getDepartments()
        .then((data) => {
            res.render("addEmployee", { departments: data });
        })
        .catch((err) => {
            res.render("addEmployee", { departments: [] });
        })
})

// route to upload employee form
app.post("/employees/add", ensureLogin, (req, res) => {
    const employeeData = req.body;

    dataService.addEmployee(employeeData)
        .then((data) => {
            res.redirect("/employees")
        })
        .catch((err) => {
            res.json(err)
        })

})

// route to form to add images
app.get("/images/add", ensureLogin, (req, res) => {
    res.render('addImage', {});
})

// route for uploading single photo
app.post("/images/add", ensureLogin, upload.single("imageFile"), (req, res) => {
    res.redirect("/images")
})

// route to get image files as an array
app.get("/images", ensureLogin, (req, res) => {

    fs.readdir('./public/images/uploaded', (err, items) => {
        if (err) {
            res.json(err)
        }
        else {
            res.render('images', { items });
        }
    })

})

// upgraded functionality to use query string
app.get("/employees", ensureLogin, (req, res) => {
    if (req.query.status) {
        dataService.getEmployeesByStatus(req.query.status)
            .then((data) => {
                if (data.length > 0) {
                    res.render("employees", { employees: data });
                }
                else {
                    res.render("employees", { message: "no results" });
                }
            })
            .catch((err) => {
                res.render("employees", { message: "no results" });
            })
    }
    else if (req.query.department) {
        dataService.getEmployeesByDepartment(req.query.department)
            .then((data) => {
                if (data.length > 0) {
                    res.render("employees", { employees: data });
                }
                else {
                    res.render("employees", { message: "no results" });
                }
            })
            .catch((err) => {
                res.render("employees", { message: "no results" });
            })
    }
    else if (req.query.manager) {
        dataService.getEmployeesByManager(req.query.manager)
            .then((data) => {
                if (data.length > 0) {
                    res.render("employees", { employees: data });
                }
                else {
                    res.render("employees", { message: "no results" });
                }
            })
            .catch((err) => {
                res.render("employees", { message: "no results" });
            })
    }
    else {
        dataService.getAllEmployees()
            .then((data) => {
                if (data.length > 0) {
                    res.render("employees", { employees: data });
                }
                else {
                    res.render("employees", { message: "no results" });
                }
            })
            .catch((err) => {
                res.render("employees", { message: "no results" });
            })
    }
});

// route to get employee number by value using parameters
app.get("/employee/:empNum", ensureLogin, (req, res) => {

    // initialize an empty object to store the values
    let viewData = {};

    dataService.getEmployeeByNum(req.params.empNum).then((data) => {
        if (data) {
            viewData.employee = data; //store employee data in the "viewData" object as "employee"
        } else {
            viewData.employee = null; // set employee to null if none were returned
        }
    }).catch(() => {
        viewData.employee = null; // set employee to null if there was an error 
    }).then(dataService.getDepartments)
        .then((data) => {
            viewData.departments = data; // store department data in the "viewData" object as "departments"

            // loop through viewData.departments and once we have found the departmentId that matches
            // the employee's "department" value, add a "selected" property to the matching 
            // viewData.departments object

            for (let i = 0; i < viewData.departments.length; i++) {
                if (viewData.departments[i].departmentId == viewData.employee.department) {
                    viewData.departments[i].selected = true;
                }
            }
        }).catch(() => {
            viewData.departments = []; // set departments to empty if there was an error
        }).then(() => {
            if (viewData.employee == null) { // if no employee - return an error
                res.status(404).send("Employee Not Found");
            } else {
                res.render("employee", { viewData: viewData }); // render the "employee" view
            }
        }).catch(() => {
            res.status(404).send("Employee Not Found");
        });
});

// route to update employee info
app.post("/employee/update", ensureLogin, (req, res) => {
    dataService.updateEmployee(req.body)
        .then((data) => {
            res.redirect("/employees");
        })
        .catch((err) => {
            res.render("employee", { message: "no results" });
        })
});

app.get("/employee/delete/:empNum", ensureLogin, (req, res) => {
    dataService.deleteEmployeeByNum(req.params.empNum)
        .then(() => {
            res.redirect("/employees");
        })
        .catch((err) => {
            res.status(500).send("Unable to Remove Employee / Employee not found");
        })
})

app.get("/departments", ensureLogin, (req, res) => {
    dataService.getDepartments()
        .then((data) => {
            if (data.length > 0) {
                res.render("departments", { departments: data });
            }
            else {
                res.render("departments", { message: "no results" });
            }
        })
        .catch((err) => {
            res.render("departments", { message: "no results" });
        })
});


// add departments
app.get("/departments/add", ensureLogin, (req, res) => {
    res.render('addDepartment', {});
})

// route to upload departments form
app.post("/departments/add", ensureLogin, (req, res) => {
    const departmentData = req.body;

    dataService.addDepartment(departmentData)
        .then((data) => {
            res.redirect("/departments")
        })
        .catch((err) => {
            res.json(err)
        })
})

// route to update department info
app.post("/department/update", ensureLogin, (req, res) => {
    dataService.updateDepartment(req.body)
        .then((data) => {
            res.redirect("/departments");
        })
        .catch((err) => {
            res.render("departments", { message: "no results" });
        })
});

// route to get department number by value using parameters
app.get("/department/:departmentId", ensureLogin, (req, res) => {
    dataService.getDepartmentById(req.params.departmentId)
        .then((data) => {
            if (data.length > 0) {
                res.render("department", { departments: data[0] });
            }
            else {
                res.status(404).send("Department Not Found");
            }
        })
        .catch((err) => {
            res.status(404).send("Department Not Found");
        })
})

app.get("/departments/delete/:departmentId", ensureLogin, (req, res) => {
    dataService.deleteDepartmentById(req.params.departmentId)
        .then(() => {
            res.redirect("/departments");
        })
        .catch((err) => {
            res.status(500).send("Unable to Remove Department / Department not found");
        })
})

// Login and Register routes

app.get("/login", (req, res) => {
    res.render('login', {});
})

app.get('/register', (req, res) => {
    res.render('register', {});
})

app.post('/register', (req, res) => {
    dataServiceAuth.registerUser(req.body)
        .then(() => {
            res.render('register', { successMessage: "User created" })
        })
        .catch((err) => {
            res.render('register', { errorMessage: err, userName: req.body.userName })
        })
})

app.post('/login', (req, res) => {
    req.body.userAgent = req.get('User-Agent');
    dataServiceAuth.checkUser(req.body)
        .then((user) => {
            req.session.user = {
                userName: user.userName,
                email: user.email,
                loginHistory: user.loginHistory
            }
            res.redirect('/employees');
        })
        .catch((err) => {
            res.render('login', { errorMessage: err, userName: req.body.userName })
        })
})


app.get('/logout', (req, res) => {
    req.session.reset();
    res.redirect("/");
})

app.get('/userHistory', ensureLogin, (req, res) => {
    res.render('userHistory', {})
})


app.use((req, res) => {
    res.status(404).send("Error 404: Page Not Found");
});

// setup http server to listen on HTTP_PORT
dataService.initialize()
    .then(dataServiceAuth.initialize)
    .then(() => {
        app.listen(HTTP_PORT, onHttpStart)
    })
    .catch((err) => {
        console.log("unable to start server: " + err)
    });


