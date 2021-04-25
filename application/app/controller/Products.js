const ProductsDAO = require('../model/Products.js');

class Products{
    constructor(options){
        this.productDAO = new ProductsDAO();
        if(options) this.options = options;
    }

    formatReturn(data, status){
        if(this.options.htmlResponse && !status) throw new Error("If options.htmlResponse is true, then must be sent a HTTP Status Code.")
        return this.options.htmlResponse ? { status, response: data } : data;
    }

    validateType(value, properties){
        if(!properties.type) return true;
        if((value === null || value === "null" || value === "") && properties.canNull) return true;
        switch(properties.type){
            case "str":
            case "string":
                return typeof value === 'string';
            case "int":
            case "integer":
                return Number.isInteger(value);
            case "bool":
            case "boolean":
                return typeof variable === "boolean";
            case "array":
                return Array.isArray(value);
            case "obj":
            case "object":
                return typeof variable === "object";
            default:
                return false;
        }
    }

    valueExists(value){
        return (value || (value === null || value === "null" || value === "")) ? true : false;
    }

    valueCanBeNull(value, canBeNull){
        if(value) return true;
        return canBeNull ? true : false;
    }

    recursiveValidate(obj, props){
        let _props = props;
        let _p = _props.shift();

        if(!this.valueExists(obj[_p.property])) return { ok: false, error: `Error on body request: The property ${_p.property} isn't be a null.` };
        
        if(!this.valueCanBeNull(obj[_p.property], _p.canNull)) return { ok: false, error: `Error on body request: The property ${_p.property} of the product must be sent.` };
        
        if(!this.validateType(obj[_p.property], _p)) return { ok: false, error: `Error on body request: The property ${_p.property} isn't a ${_p.type}.` };

        return _props.length == 0 ? { ok: true } : this.recursiveValidate(obj, _props);
    }

    validateInputProduct(prod){
        const allProps = [
            { property: 'title', type: "string" },
            { property: 'sku', type: "string" },
            { property: 'barcodes', type: "array" },
            { property: 'description', type: "string", canNull: true },
            { property: 'attributes', type: "array" },
            { property: 'price', type: "string" }
        ];

        return this.recursiveValidate(prod, allProps);
    }

    async showProducts(params = {}){
        try{
            await this.productDAO.test();
        }catch(e){
            console.log("CONTROLLER ERROR", e.message);
        }
        const options = [];
        options.push({ standard: { start: parseInt(params.start) || 0, num: parseInt(params.num) || 0 } });

        params.sku ? options.push({ sku: params.sku }) : null;
        params.barcode ? options.push({ barcode: params.barcode }) : null;
        params.fields ? options.push({ fields: params.fields }) : null;

        let productList = this.productDAO.getList(options);
        return this.formatReturn({ totalCount: productList.length, items: productList }, 200);
    }

    showById(id, params = {}){
        let { fields } = params;
        let product = this.productDAO.getById(id, fields);
        return this.formatReturn(product, 200);
    }

    addProduct(obj){
        let validate = this.validateInputProduct(obj);
        if(!validate.ok) return this.formatReturn(validate.error, 400);

        const id = this.productDAO.saveProduct(obj);
        return Number.isInteger(id) ? this.formatReturn({ id }, 200) : this.formatReturn({ errorText: "Server error when did save your product. Try again or later." }, 500);
    }

    updateProduct(id, obj){
        return this.productDAO.updateProduct(id, obj);
    }

    deleteProduct(id){
        return this.productDAO.deleteProduct(id);
    }
}

module.exports = Products;