#!/usr/bin/env ruby
require 'json'
require 'rest-client'

URL = 'http://localhost:8983/solr/products/update'
COMMIT_URL = 'http://localhost:8983/solr/products/update?commit=true'

products = JSON.parse File.read("data.json")
products.each_slice(1000) do |batch|
	res = RestClient.post(URL, batch.to_json, :content_type => :json, :accept => :json)
end

resp = RestClient.get(COMMIT_URL)
