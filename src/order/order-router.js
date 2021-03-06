const path = require('path')
const express = require('express')
const OrderServices = require('./order-services')

const orderRouter = express.Router()
const jsonParser = express.json()

orderRouter
    .route('/')
    .get((req, res, next) => {
        var quserid = req.query.userid || "";
        var qshopid = req.query.shopid || "";

        if (quserid != "") {
            OrderServices.getOrdersbyUser(req.app.get('db'), quserid)
                .then(orders => {
                    res.json(orders)
                })
                .catch(next)
        }

        else if (qshopid != "") {
            OrderServices.getOrdersbyShop(req.app.get('db'), qshopid)
                .then(orders => {
                    res.json(orders)
                })
                .catch(next)
        }


        else {
            OrderServices.getAllOrders(req.app.get('db'))
            .then(orders => {
                res.json(orders)
            })
            .catch(next)
        }
    })

    .post(jsonParser, (req, res, next) => {

        var orderdate = Date.now();
        var orderstatus = "Pending";

        const { ordershopid, orderuserid, orderdata } = req.body

        const newOrder = { ordershopid, orderuserid, orderdata, orderstatus, orderdate  }
        console.log(req.body);
        console.log(newOrder);
        for (const [key, value] of Object.entries(newOrder)) {
            if (value == null) {
                return res.status(400).json({
                    error: { message: `Missing '${key}' in request body` }
                })
            }
        }

        OrderServices.insertOrder(req.app.get('db'), newOrder)
            .then(order => {
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl + `/${order.orderid}`))
                    .json(order)
            })
            .catch(next)
    })

orderRouter
    .route('/:orderid')

    .all((req, res, next) => {
        OrderServices.getOrdersById(req.app.get('db'), req.params.orderid)
            .then(order => {
                if (!order) {
                    return res.status(404).json({
                        error: { message: `Order doesn't exist` }
                    })
                }
                res.order = order
                next()
            })
            .catch(next)
    })

    .get((req, res, next) => {
        res.json({
            orderid: res.order.orderid,
            ordershopid: res.order.ordershopid,
            orderuserid: res.order.orderuserid,
            orderdata: res.order.orderdata,
            orderstatus: res.order.orderstatus,
            orderdate: res.order.orderdate,
            orderdatecompleted: res.order.datecompleted
        })
    })

    .delete((req, res, next) => {
        OrderServices.deleteOrder(
            req.app.get('db'),
            req.params.orderid
        )
            .then(() => {
                res.status(204).end()
            })
            .catch(next)
    })

    .patch(jsonParser, (req, res, next) => {
        var orderdatecompleted = Date.now();

        const { orderstatus } = req.body
        const orderToUpdate = { orderstatus, orderdatecompleted }
        const numberOfValues = Object.values(orderToUpdate).filter(Boolean).length
        if (numberOfValues === 0) {
            return res.status(400).json({
                error: {
                    message: numberOFValues
                }
            })
        }

        OrderServices.updateOrder(req.app.get('db'), req.params.orderid, orderToUpdate)
            .then(numRowsAffected => {
                res.status(200).json({})
            })
            .catch(next)
    })

module.exports = orderRouter