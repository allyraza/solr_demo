import os
import sys
import requests
import json
from bs4 import BeautifulSoup

LOCATION = './data/products'
POST_URL = 'http://localhost:8983/solr/products/update'
GET_URL = 'http://localhost:8983/solr/products/get?id='

def post_file(fn, hdrs={'Content-type': 'application/json'}):
    with open(fn, 'rb') as fo:
        data = fo.read()
        xml = BeautifulSoup(data, "lxml")
        
        documents = []
        for product in xml.findAll("product"):
            model = product.modelnumber.text if product.modelnumber else ""
            weight = product.shippingweight.text if product.shippingweight else 0.0
            color = product.color.text if product.color else ""
            condition = product.condition.text if product.condition else "New"
            manufacturer = product.manufacturer.text if product.manufacturer else ""

            documents.append({
                "id": int(product.productid.text),
                "name": product.find("name").text,
                "price": float(product.regularprice.text),
                "price_sale": float(product.saleprice.text),
                "on_sale": product.onsale.text,
                "sku": int(product.sku.text),
                "model": model,
                "weight": weight,
                "color": color,
                "type": product.type.text,
                "condition": condition,
                "summary": product.shortdescription.text,
                "image": product.image.text,
                "image_thumbnail": product.thumbnailimage.text,
                "image_large": product.largeimage.text,
                "category": product.department.text,
                "category_id": int(product.departmentid.text),
                "manufacturer": manufacturer,
                "is_active": product.active.text,
                "is_new": product.new.text
            })
        
        res = requests.post(url=POST_URL, json=documents, headers=hdrs)

        print "%r %r" % (res, fn)
        if res.status_code != 200:
            raise RuntimeError('status: %r, error: %r' % (res.status_code, res.text))

def get_products():
    try:
        res = requests.get() 
        if res.status_code != 200:
            raise RuntimeError('status_code != 200\nstatus: %r\n' % res.status_code)
    except:
        logging.exception("error while posting file")

def main():
    for dirpath, dirnames, filenames in os.walk(LOCATION):
        for fn in filenames:
            if fn.endswith('.xml'):
                filepath = os.path.join(dirpath, fn)
                post_file(filepath)

    # post_file('./data/products.xml')

if __name__=='__main__':
    main()
