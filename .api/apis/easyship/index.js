import Oas from 'oas';
import APICore from 'api/dist/core';
import definition from './openapi.json';
class SDK {
    constructor() {
        this.spec = Oas.init(definition);
        this.core = new APICore(this.spec, 'easyship/v2024-09 (api/6.1.2)');
    }
    /**
     * Optionally configure various options that the SDK allows.
     *
     * @param config Object of supported SDK options and toggles.
     * @param config.timeout Override the default `fetch` request timeout of 30 seconds. This number
     * should be represented in milliseconds.
     */
    config(config) {
        this.core.setConfig(config);
    }
    /**
     * If the API you're using requires authentication you can supply the required credentials
     * through this method and the library will magically determine how they should be used
     * within your API request.
     *
     * With the exception of OpenID and MutualTLS, it supports all forms of authentication
     * supported by the OpenAPI specification.
     *
     * @example <caption>HTTP Basic auth</caption>
     * sdk.auth('username', 'password');
     *
     * @example <caption>Bearer tokens (HTTP or OAuth 2)</caption>
     * sdk.auth('myBearerToken');
     *
     * @example <caption>API Keys</caption>
     * sdk.auth('myApiKey');
     *
     * @see {@link https://spec.openapis.org/oas/v3.0.3#fixed-fields-22}
     * @see {@link https://spec.openapis.org/oas/v3.1.0#fixed-fields-22}
     * @param values Your auth credentials for the API; can specify up to two strings or numbers.
     */
    auth(...values) {
        this.core.setAuth(...values);
        return this;
    }
    /**
     * If the API you're using offers alternate server URLs, and server variables, you can tell
     * the SDK which one to use with this method. To use it you can supply either one of the
     * server URLs that are contained within the OpenAPI definition (along with any server
     * variables), or you can pass it a fully qualified URL to use (that may or may not exist
     * within the OpenAPI definition).
     *
     * @example <caption>Server URL with server variables</caption>
     * sdk.server('https://{region}.api.example.com/{basePath}', {
     *   name: 'eu',
     *   basePath: 'v14',
     * });
     *
     * @example <caption>Fully qualified server URL</caption>
     * sdk.server('https://eu.api.example.com/v14');
     *
     * @param url Server URL
     * @param variables An object of variables to replace into the server URL.
     */
    server(url, variables = {}) {
        this.core.setServer(url, variables);
    }
    /**
     * Create a temporary app access redirect token
     *
     * Required authorization scope: `public.app_access:write`
     *
     *
     * @summary Create an App Access
     * @throws FetchError<400, types.AppAccessCreateResponse400> missing app name
     * @throws FetchError<422, types.AppAccessCreateResponse422> invalid target
     */
    app_access_create(body) {
        return this.core.fetch('/2024-09/account/app_accesses', 'post', body);
    }
    /**
     * Activate specific uploaded asset and define other assets of the same type as inactive.
     *
     * Required authorization scope: `public.asset:write`
     *
     *
     * @summary Activate Assets
     */
    asset_activate_create(metadata) {
        return this.core.fetch('/2024-09/account/assets/{id}/activate', 'post', metadata);
    }
    /**
     * Deactivate specific uploaded asset.
     *
     * Required authorization scope: `public.asset:write`
     *
     *
     * @summary Deactivate Assets
     */
    asset_deactivate_create(metadata) {
        return this.core.fetch('/2024-09/account/assets/{id}/deactivate', 'post', metadata);
    }
    /**
     * Retrieve a list of assets.
     *
     * Required authorization scope: `public.asset:read`
     *
     *
     * @summary List all Assets
     */
    assets_index(metadata) {
        return this.core.fetch('/2024-09/account/assets', 'get', metadata);
    }
    /**
     * Create an asset.
     *
     * > You can store up to five assets for each type.
     * > Allowed file types: png or jpeg.
     *
     * Required authorization scope: `public.asset:write`
     *
     *
     * @summary Create an Asset
     * @throws FetchError<400, types.AssetsCreateResponse400> uploaded assets count exceeds limitation
     */
    assets_create(body) {
        return this.core.fetch('/2024-09/account/assets', 'post', body);
    }
    assets_update(body, metadata) {
        return this.core.fetch('/2024-09/account/assets/{id}', 'patch', body, metadata);
    }
    /**
     * Delete an asset.
     *
     * Required authorization scope: `public.asset:write`
     *
     *
     * @summary Delete an Asset
     * @throws FetchError<404, types.AssetsDeleteResponse404> no record found
     */
    assets_delete(metadata) {
        return this.core.fetch('/2024-09/account/assets/{id}', 'delete', metadata);
    }
    /**
     * Easyship integrate with Stripe Payment Intent to collect credit card payments.
     * Ref: https://stripe.com/docs/payments/payment-intents
     *
     * The confirmation process includes the collection of payment and creation of a
     * transaction record (credit) in your account.
     *
     * Should the payment intent not have undergone 3D Secure, you'll receive a status code
     * 202, indicating the need to process 3D Secure.
     *
     * Required authorization scope: `public.payment:write`
     *
     *
     * @summary Confirm Credit Top-up
     * @throws FetchError<422, types.CreditConfrim3DsCreateResponse422> payment intent has been confirmed
     */
    credit_confrim_3ds_create(body) {
        return this.core.fetch('/2024-09/account/credit/confirm_3ds', 'post', body);
    }
    /**
     * Refund your credit.
     *
     * Required authorization scope: `public.payment:write`
     *
     *
     * @summary Refund a Credit
     * @throws FetchError<422, types.CreditRefundCreateResponse422> insufficient balance
     */
    credit_refund_create(body) {
        return this.core.fetch('/2024-09/account/credit/refund', 'post', body);
    }
    /**
     * Retrieve your credit balance.
     *
     * Required authorization scope: `public.credit:read`
     *
     *
     * @summary Get credit
     */
    credits_show() {
        return this.core.fetch('/2024-09/account/credit', 'get');
    }
    /**
     * Top up your credit.
     *
     * In case your payment source (credit card) requires 3D validation use the Stripe SDK.
     *
     * To detect any fraudulent activities and initiate Radar and 3D Secure, integrate
     * `handleCardAction` from Stripe.js.
     * Reference: https://stripe.com/docs/js/payment_intents/handle_card_action
     *
     * Example:
     * ```html
     * <script src="https://js.stripe.com/v3/"></script>
     * <script>
     *    // Retrieve Easyship stripe publishable api key through `GET /2024-09/account/stripe`
     *    var stripe = Stripe('stripe_publishable_api_key');
     *
     *    // When `POST /2024-09/account/credit` returns status code 202, retrieve the secret
     * in the response.
     *    var secret = response.action.client_secret
     *
     *    // 3D validation
     *    stripe.handleCardAction(secret).then(function (result) {
     *      if (result.error) {
     *        // error handling
     *      } else {
     *        // You would receive stripe payment_intent object
     *        // `POST /2024-09/account/credit/confirm_3ds` with payment_intent.id to confirm
     * credit top-up
     *      }
     *    });
     *  </script>
     * ```
     *
     * > If you are using an authorized bank account as your payment method, the transaction
     * might take around 1 to 3 days to complete.
     *
     * Required authorization scope: `public.payment:write`
     *
     *
     * @summary Add credit
     * @throws FetchError<404, types.CreditsCreateResponse404> record not found
     */
    credits_create(body) {
        return this.core.fetch('/2024-09/account/credit', 'post', body);
    }
    /**
     * Create a redirect to the Easyship Dashboard.
     *
     * Required authorization scope: `public.redirect:write`
     *
     *
     * @summary Create a Redirect
     * @throws FetchError<422, types.RedirectsCreateResponse422> invalid params
     */
    redirects_create(body) {
        return this.core.fetch('/2024-09/account/redirects', 'post', body);
    }
    /**
     * Retrieve account settings.
     *
     * Required authorization scope: `public.setting:read`
     *
     *
     * @summary List Account Settings
     */
    settings_index() {
        return this.core.fetch('/2024-09/account/settings', 'get');
    }
    /**
     * Update multiple account settings.
     *
     * Required authorization scope: `public.setting:write`
     *
     *
     * @summary Update Multiple Account Settings
     */
    settings_update(body) {
        return this.core.fetch('/2024-09/account/settings', 'post', body);
    }
    /**
     * Retrieve a stripe public key according to your registration country.
     *
     * Required authorization scope: `public.payment_sources:read`
     *
     *
     * @summary Get a Stripe Public Key
     */
    stripes_show() {
        return this.core.fetch('/2024-09/account/stripe', 'get');
    }
    /**
     * Retrieve information about current account
     *
     * Properties below would display only when the access token includes the corresponding
     * scopes.
     *
     * | Property | Required API Scope |
     * | -------- | ------------------ |
     * | `billing_address` | `public.address:read` |
     * | `credit` | `public.credit:read` |
     * | `payment_sources` | `public.payment_source:read` |
     *
     *
     * @summary Information about the Account
     */
    account_show() {
        return this.core.fetch('/2024-09/account', 'get');
    }
    /**
     * Activate specific address
     *
     * Required authorization scope: `public.address:write`
     *
     *
     * @summary Activate an Address
     */
    address_activate_create(metadata) {
        return this.core.fetch('/2024-09/addresses/{id}/activate', 'post', metadata);
    }
    /**
     * Deactivate specific address.
     *
     * If the address is default for the company, the first active address will be set as
     * default.
     *
     * Required authorization scope: `public.address:write`
     *
     *
     * @summary Deactivate an Address
     */
    address_deactivate_create(metadata) {
        return this.core.fetch('/2024-09/addresses/{id}/deactivate', 'post', metadata);
    }
    /**
     * Create an address validation.
     *
     * Required authorization scope: `public.address_validation:write`
     *
     * > This API requires an updated contract with Easyship. Get in touch with your account
     * manager or Easyship Support Team.
     *
     *
     * @summary Validate a single address
     * @throws FetchError<422, types.AddressesValidationResponse422> invalid request
     */
    addresses_validation(body) {
        return this.core.fetch('/2024-09/addresses/validations', 'post', body);
    }
    /**
     * Retrieve a list of all addresses ordered by date of creation.
     *
     * Required authorization scope: `public.address:read`
     *
     *
     * @summary List all Addresses
     */
    addresses_index(metadata) {
        return this.core.fetch('/2024-09/addresses', 'get', metadata);
    }
    /**
     * Create a new address.
     *
     * Required authorization scope: `public.address:write`
     *
     *
     * @summary Create an Address
     * @throws FetchError<422, types.AddressesCreateResponse422> failed validations
     */
    addresses_create(body) {
        return this.core.fetch('/2024-09/addresses', 'post', body);
    }
    /**
     * Update an address in your account.
     *
     * Required authorization scope: `public.address:write`
     *
     *
     * @summary Update an Address
     * @throws FetchError<404, types.AddressesUpdateResponse404> record not found
     * @throws FetchError<422, types.AddressesUpdateResponse422> failed validations
     */
    addresses_update(body, metadata) {
        return this.core.fetch('/2024-09/addresses/{address_id}', 'patch', body, metadata);
    }
    /**
     * Retrieve sales analytics.
     *
     * Required authorization scope: `public.analytics:read`
     *
     *
     * @summary List Analytics Sale Channels Data
     * @throws FetchError<400, types.AnalyticsSaleChannelsIndexResponse400> failed validations
     */
    analytics_sale_channels_index(metadata) {
        return this.core.fetch('/2024-09/analytics/sale_channels', 'get', metadata);
    }
    /**
     * Retrieve shipment status. Possible statuses:
     * - Label Pending
     * - Label Rejected
     * - Label Ready
     * - Pickup/Drop-off in Progress
     * - In Transit to Customer
     * - Failed Delivery Attempt
     * - Exception
     *
     * Required authorization scope: `public.analytics:read`
     *
     *
     * @summary List Analytics Shipment Status Data
     * @throws FetchError<400, types.AnalyticsShipmentStatusIndexResponse400> failed validations
     */
    analytics_shipment_status_index(metadata) {
        return this.core.fetch('/2024-09/analytics/shipment_status', 'get', metadata);
    }
    /**
     * Retrieve data on whether the company has made any shipments within specified period.
     *
     * Required authorization scope: `public.analytics:read`
     *
     *
     * @summary List Shipment Analytics within a Date Range
     * @throws FetchError<400, types.AnalyticsShipmentShippedIndexResponse400> failed validations
     */
    analytics_shipment_shipped_index(metadata) {
        return this.core.fetch('/2024-09/analytics/shipments_shipped', 'get', metadata);
    }
    /**
     * Retrieve analytics shipments data.
     *
     * Required authorization scope: `public.analytics:read`
     *
     *
     * @summary List Analytics Shipments Data
     * @throws FetchError<400, types.AnalyticsShipmentsIndexResponse400> failed validations
     */
    analytics_shipments_index(metadata) {
        return this.core.fetch('/2024-09/analytics/shipments', 'get', metadata);
    }
    /**
     * Retrieve analytics top couriers data.
     *
     * Required authorization scope: `public.analytics:read`
     *
     *
     * @summary List Analytics Top Couriers Data
     * @throws FetchError<400, types.AnalyticsTopCouriersIndexResponse400> failed validations
     */
    analytics_top_couriers_index(metadata) {
        return this.core.fetch('/2024-09/analytics/top_couriers', 'get', metadata);
    }
    /**
     * Retrieve a company top shipments destinations country.
     *
     * Required authorization scope: `public.analytics:read`
     *
     *
     * @summary List Analytics Top Shipments Destinations
     * @throws FetchError<400, types.AnalyticsTopShipmentsDestinationsIndexResponse400> failed validations
     */
    analytics_top_shipments_destinations_index(metadata) {
        return this.core.fetch('/2024-09/analytics/top_shipments_destinations', 'get', metadata);
    }
    /**
     * Create a batch of addresses.
     *
     * Required authorization scopes: `public.batch:write`, `public.address:write`
     *
     *
     * @summary Create a Batch of Addresses
     * @throws FetchError<400, types.BatchAddressesCreateResponse400> missing params
     */
    batch_addresses_create(body) {
        return this.core.fetch('/2024-09/batches/addresses', 'post', body);
    }
    /**
     * Retrieve a list of all batches ordered by date of creation.
     *
     * Required authorization scope: `public.batch:read`
     *
     *
     * @summary List all Batch Items
     * @throws FetchError<404, types.BatchItemsIndexResponse404> record not found
     */
    batch_items_index(metadata) {
        return this.core.fetch('/2024-09/batches/{batch_id}/items', 'get', metadata);
    }
    /**
     * Create a batch of labels.
     *
     * Required authorization scopes: `public.batch:write`, `public.label:write`
     *
     * Labels confirm a shipment created with the Shipment API. Calling **Batch Labels** will
     * confirm shipments with selected courier service and begin generating the label and
     * shipping documents if your account balance is sufficient.
     *
     * > You can enter a `courier_service_id` to assign a specific courier service in case your
     * shipment has no assigned courier yet, or you need to overwrite the one suggested by
     * default. Your shipment will be confirmed. If there is no assigned courier service and
     * you leave the `courier_service_id` field blank, we will automatically assign the best
     * value for money courier to your shipment.
     *
     * ## Asynchronous response
     *
     * The label and shipping documents will be generated asynchronously. If you specified a
     * `Callback URL` through the Easyship dashboard, this URL will be called when the
     * documents are ready.
     * Whilst these documents are being generated, the `label_state` will be set to `pending`.
     * The possible states are `not_created`, `pending`, `failed` and `generated`.
     *
     *
     * @summary Create a Batch of Labels
     * @throws FetchError<400, types.BatchLabelsCreateResponse400> missing params
     */
    batch_labels_create(body) {
        return this.core.fetch('/2024-09/batches/labels', 'post', body);
    }
    /**
     * Create a batch of shipments and schedule it for processing.
     *
     * Required authorization scopes: `public.batch:write`, `public.shipment:write` and
     * `public.label:write` if a label(s) will be created during the batch processing.
     *
     *
     * @summary Create a Batch of Shipments
     * @throws FetchError<400, types.BatchShipmentsCreateResponse400> missing params
     */
    batch_shipments_create(body) {
        return this.core.fetch('/2024-09/batches/shipments', 'post', body);
    }
    /**
     * Retrieve a list of all batches ordered by date of creation.
     *
     * Required authorization scope: `public.batch:read`
     *
     *
     * @summary List all Batches
     */
    batches_index(metadata) {
        return this.core.fetch('/2024-09/batches', 'get', metadata);
    }
    /**
     * Retrieve a batch by its ID.
     *
     * Required authorization scope: `public.batch:read`
     *
     *
     * @summary Get a Batch
     * @throws FetchError<404, types.BatchesShowResponse404> record not found
     */
    batches_show(metadata) {
        return this.core.fetch('/2024-09/batches/{batch_id}', 'get', metadata);
    }
    /**
     * Download the Billing Document in PDF format.
     *
     * Required authorization scope: `public.billing_document:read`
     *
     *
     * @summary Download Billing Document
     * @throws FetchError<404, types.BillingDocumentsDownloadResponse404> record not found
     */
    billing_documents_download(metadata) {
        return this.core.fetch('/2024-09/billing_documents/{id}/download', 'get', metadata);
    }
    /**
     * Retrieve a list of all billing documents within range.
     * Pagination of this endpoint is not indexed.
     * `count` on the response body will always be `null`.
     *
     * Required authorization scope: `public.billing_document:read`
     *
     *
     * @summary List all Billing Documents
     * @throws FetchError<422, types.BillingDocumentsIndexResponse422> failed validations
     */
    billing_documents_index(metadata) {
        return this.core.fetch('/2024-09/billing_documents', 'get', metadata);
    }
    /**
     * Retrieve a list of available courier boxes and your custom boxes.
     *
     * Required authorization scope: `public.box:read`
     *
     * This request returns box types specified with a `slug` when creating a shipment via the
     * API or dashboard.
     *
     * > In Easyship API terms, `slug` is a string field used by the `box` object. Slugs
     * contain dimensions of corresponding box types: when you create a shipment, we will get
     * dimensions based on the `slug` provided.
     *
     *
     * @summary List all Boxes
     */
    boxes_index(metadata) {
        return this.core.fetch('/2024-09/boxes', 'get', metadata);
    }
    /**
     * Create a box.
     *
     * Required authorization scope: `public.box:write`
     *
     *
     * @summary Create a Box
     * @throws FetchError<422, types.BoxesCreateResponse422> failed validations
     */
    boxes_create(body) {
        return this.core.fetch('/2024-09/boxes', 'post', body);
    }
    boxes_update(body, metadata) {
        return this.core.fetch('/2024-09/boxes/{box_id}', 'patch', body, metadata);
    }
    /**
     * Delete a box from your account.
     *
     * Required authorization scope: `public.box:write`
     *
     *
     * @summary Delete a Box
     * @throws FetchError<404, types.BoxesDeleteResponse404> record not found
     */
    boxes_delete(metadata) {
        return this.core.fetch('/2024-09/boxes/{box_id}', 'delete', metadata);
    }
    /**
     * Retrieve a list of countries.
     *
     * Required authorization scope: `public.reference:read`
     *
     * Available filtering parameters: by Alpha-2 country code or continent.
     *
     *
     * @summary List all Countries
     */
    countries_index(metadata) {
        return this.core.fetch('/2024-09/countries', 'get', metadata);
    }
    /**
     * Retrieve a list of estimated delivery dates for a specific courier service.
     *
     * Required authorization scope: `public.courier_service:read`
     *
     * Easyship builds estimation model based on shipments delivered within last 12 months. If
     * you use Link Your Own Rates (LYOC) scheme, LYOC couriers are excluded from the
     * calculation.
     *
     *
     * @summary List all Estimated Delivery Dates for a Courier Service
     * @throws FetchError<404, types.CourierServiceEstimatedDeliveryDatesIndexResponse404> courier not found
     * @throws FetchError<422, types.CourierServiceEstimatedDeliveryDatesIndexResponse422> Invalid origin_country_alpha2
     */
    courier_service_estimated_delivery_dates_index(metadata) {
        return this.core.fetch('/2024-09/courier_services/{courier_service_id}/estimated_delivery_dates', 'get', metadata);
    }
    /**
     * Retrieve a list of pickup slots in local time for the coming seven days.
     *
     * Required authorization scope: `public.pickup:read`
     *
     *
     * @summary List Available Pickup Slots
     * @throws FetchError<400, types.CourierServicesPickupSlotsIndexResponse400> failed validations
     * @throws FetchError<404, types.CourierServicesPickupSlotsIndexResponse404> pickup not supported by courier service
     */
    courier_services_pickup_slots_index(metadata) {
        return this.core.fetch('/2024-09/courier_services/{courier_service_id}/pickup_slots', 'get', metadata);
    }
    /**
     * Retrieve a list of courier services available with your account.
     *
     * Required authorization scope: `public.courier_service:read`
     *
     *
     * @summary List all Courier Services
     */
    courier_services_index(metadata) {
        return this.core.fetch('/2024-09/courier_services', 'get', metadata);
    }
    /**
     * Retrieve a list of courier services for selected courier.
     *
     * Required authorization scope: `public.courier_service:read`
     *
     *
     * @summary List all Courier Services of a Courier
     */
    courier_courier_services_index(metadata) {
        return this.core.fetch('/2024-09/couriers/{courier_id}/courier_services', 'get', metadata);
    }
    /**
     * Deactivates a courier account.
     *
     * Required authorization scope: `public.courier:write`
     *
     *
     * @summary Deactivate a Courier
     * @throws FetchError<404, types.CouriersDeactivateResponse404> record not found
     * @throws FetchError<422, types.CouriersDeactivateResponse422> failed validations
     */
    couriers_deactivate(metadata) {
        return this.core.fetch('/2024-09/couriers/{courier_id}/deactivate', 'post', metadata);
    }
    /**
     * Retrieve a list of couriers.
     *
     * Required authorization scope: `public.courier:read`
     *
     *
     * @summary List all Couriers
     */
    couriers_index(metadata) {
        return this.core.fetch('/2024-09/couriers', 'get', metadata);
    }
    /**
     * Creates a new courier.
     * - `201` status when created successfully.
     * - `202` status when created but requiring additional verification.
     *
     * Required authorization scope: `public.courier:write`
     *
     *
     * @summary Create a Courier
     * @throws FetchError<402, types.CouriersCreateResponse402> over limit
     * @throws FetchError<422, types.CouriersCreateResponse422> failed validations
     */
    couriers_create(body) {
        return this.core.fetch('/2024-09/couriers', 'post', body);
    }
    /**
     * Retrieve details of a couriers.
     *
     * Required authorization scope: `public.courier:read`
     *
     *
     * @summary Get a Courier
     * @throws FetchError<404, types.CouriersShowResponse404> record not found
     */
    couriers_show(metadata) {
        return this.core.fetch('/2024-09/couriers/{courier_id}', 'get', metadata);
    }
    couriers_update(body, metadata) {
        return this.core.fetch('/2024-09/couriers/{courier_id}', 'patch', body, metadata);
    }
    /**
     * Delete a LYOC courier.
     *
     * Required authorization scope: `public.courier:write`
     *
     *
     * @summary Delete a Courier
     * @throws FetchError<404, types.CouriersDeleteResponse404> record not found
     */
    couriers_delete(metadata) {
        return this.core.fetch('/2024-09/couriers/{courier_id}', 'delete', metadata);
    }
    /**
     * Retrieve a list of HS codes.
     *
     * Required authorization scope: `public.hs_code:read`
     *
     * **Rate limit**: This endpoint is rate-limited by 100 requests per second, 1,000 requests
     * per minute, 1,000 requests per hour, 1,000 requests per day, and 30,000 requests per
     * month.
     * Exceeding this limit returns a `429 Too Many Requests` response for subsequent requests.
     * If you need a higher rate limit, get in touch with us.
     *
     *
     * @summary List HS Codes
     */
    hs_code_index(metadata) {
        return this.core.fetch('/2024-09/hs_codes', 'get', metadata);
    }
    /**
     * Retrieve a list of item categories.
     *
     * Required authorization scope: `public.reference:read`
     *
     *
     * @summary List all Item Categories
     */
    item_categories_index(metadata) {
        return this.core.fetch('/2024-09/item_categories', 'get', metadata);
    }
    /**
     * Retrieve FedEx locations.
     *
     * This endpoint routes requests to the FedEx Location API. For further information, kindly
     * look into the FedEx API documentation available at
     * https://developer.fedex.com/api/en-kr/catalog/locations/v1/docs.html.
     *
     * Required authorization scope: `public.location:read`
     *
     *
     * @summary List FedEx Locations
     * @throws FetchError<422, types.LocationsFedexIndexResponse422> invalid content
     */
    locations_Fedex_index(metadata) {
        return this.core.fetch('/2024-09/locations/fedex', 'get', metadata);
    }
    /**
     * Retrieve UPS locations.
     *
     * This endpoint routes requests to the UPS locator API. For further information, kindly
     * look into the UPS API documentation available at
     * https://developer.ups.com/api/reference?loc=en_US#operation/Locator.
     *
     * Required authorization scope: `public.location:read`
     *
     *
     * @summary List UPS Locations
     * @throws FetchError<422, types.LocationsUpsIndexResponse422> location service not found for provided courier
     * @throws FetchError<500, types.LocationsUpsIndexResponse500> forward request failed
     */
    locations_ups_index(metadata) {
        return this.core.fetch('/2024-09/locations/ups', 'get', metadata);
    }
    /**
     * Retrieve USPS locations.
     *
     * Required authorization scope: `public.location:read`
     *
     *
     * @summary List USPS Locations
     * @throws FetchError<422, types.LocationsUspsIndexResponse422> location service not found for provided courier
     * @throws FetchError<500, types.LocationsUspsIndexResponse500> forward request failed
     */
    locations_usps_index(metadata) {
        return this.core.fetch('/2024-09/locations/usps', 'get', metadata);
    }
    /**
     * Retrieve a list of
     * [manifests](https://support.easyship.com/hc/en-us/articles/4414489808525-What-Is-a-Manifest-in-Shipping).
     *
     * Required authorization scope: `public.manifest:read`
     *
     *
     * @summary List all Manifests
     */
    manifests_index(metadata) {
        return this.core.fetch('/2024-09/manifests', 'get', metadata);
    }
    /**
     * Create a
     * [manifest](https://support.easyship.com/hc/en-us/articles/4414489808525-What-Is-a-Manifest-in-Shipping).
     *
     * Required authorization scope: `public.manifest:write`
     *
     *
     * @summary Create a Manifest
     * @throws FetchError<404, types.ManifestsCreateResponse404> courier was not found
     */
    manifests_create(body) {
        return this.core.fetch('/2024-09/manifests', 'post', body);
    }
    /**
     * Retrieve details of a specific manifest.
     *
     * Required authorization scope: `public.manifest:read`
     *
     *
     * @summary Get a Manifest
     * @throws FetchError<404, types.ManifestsShowResponse404> manifest was not found
     */
    manifests_show(metadata) {
        return this.core.fetch('/2024-09/manifests/{manifest_id}', 'get', metadata);
    }
    /**
     * Easyship integrate with Stripe Setup Intent to collect credit card and bank account
     * information.
     * Ref: https://docs.stripe.com/payments/save-and-reuse-cards-only
     *
     * Here's a example of how you can process 3DS for card setup intent on the client side.
     * Once the validation is completed, you can use the `setup_intent.id` to finalize the
     * payment source in Easyship.
     *
     * <details>
     *   <summary>Confirm 3DS Example</summary>
     *   ```html
     *     <html>
     *       <body>
     *         <form id="form">
     *           <label>
     *             <span>Intent Secret</span>
     *             <input id="secret" class="field" placeholder="" />
     *           </label>
     *           <div class="button-row">
     *             <button>Submit</button>
     *           </div>
     *         </form>
     *
     *         <script src="https://js.stripe.com/v3/"></script>
     *         <script>
     *           // Retrieve Easyship stripe publishable api key through `GET
     * /2024-01/account/stripe`
     *           var stripe = Stripe('Easyship_stripe_publishable_api_key');
     *
     *           // Handle form submission and trigger 3DS
     *           var form = document.getElementById('form');
     *           form.addEventListener('submit', function (event) {
     *             event.preventDefault();
     *
     *             var secret = document.getElementById('secret').value;
     *             console.log(secret)
     *
     *             stripe.confirmCardSetup(secret).then(function (result) {
     *               if (result.error) {
     *                 // error handling
     *               } else {
     *                 // You would receive the `setup intent id` with prefix `seti_`.
     *                 // `POST /2024-01/payment_sources/confirm` here to finalize the payment
     * source in Easyship
     *               }
     *             });
     *           });
     *         </script>
     *       </body>
     *     </html>
     *   ```
     * </details>
     *
     * Should the setup intent not have undergone 3D Secure, you'll receive a status code 202,
     * indicating the need to process 3D Secure.
     *
     * If the setup intent is for us bank account. You'll receive a status code 202, indicating
     * the need to do micro deposit verification. The verification url will be provided in the
     * response and the verification code will be sent to the email address attached to the
     * bank account.
     *
     * Reference:
     * https://docs.stripe.com/payments/ach-debit/set-up-payment?platform=web&payment-ui=direct-api#optional:-send-custom-email-notifications
     *
     * Once the verification is completed, stripe webhook would mark your bank account payment
     * source activated.
     *
     * Required authorization scope: `public.payment_source:write`
     *
     *
     * @summary Confirm Payment Source
     * @throws FetchError<422, types.PaymentSourcesConfrim3DsCreateResponse422> payment source already existed
     */
    payment_sources_confrim_3ds_create(body) {
        return this.core.fetch('/2024-09/payment_sources/confirm', 'post', body);
    }
    /**
     * Retrieve a list of payment sources.
     *
     * Required authorization scope: `public.payment_source:read`
     *
     *
     * @summary List all Payment Sources
     */
    payment_sources_index(metadata) {
        return this.core.fetch('/2024-09/payment_sources', 'get', metadata);
    }
    /**
     * Create a payment sources.
     *
     * Easyship won't hold the details of your credit card. We use `stripe token` to attach the
     * credit card to your easyship account on Stripe.
     * Please upload your credit card to stripe via Stripe Token JS.
     *
     * Example:
     * <details>
     *   <summary>Stripe Token JS Example</summary>
     *   ```html
     *   <script src="https://js.stripe.com/v3/"></script>
     *   <script>
     *      // Retrieve Easyship stripe publishable api key through `GET
     * /2024-09/account/stripe`
     *      var stripe = Stripe('stripe_publishable_api_key');
     *
     *      // Create an instance of Elements.
     *      // https://stripe.com/docs/js/elements_object/create_element?type=card
     *      var elements = stripe.elements();
     *
     *      // Create a CardElement
     *      var card = elements.create('card')
     *
     *      // Create your token from the CardElement data
     *      // https://stripe.com/docs/js/tokens/create_token?type=cardElement
     *      stripe.createToken(card).then(function (result) {
     *        if (result.error) {
     *          // error handling
     *        } else {
     *          // You would receive the `stripe token` with prefix `tok_`.
     *          // `POST /2024-09/payment_sources` here to attach your card to Easyship
     *          var token = result.token;
     *        }
     *      });
     *    </script>
     *   ```
     * </details>
     *
     * When the credit card needs 3DS (with response status code 202), proceed with the next
     * step found in `POST /2024-09/payment_sources/confirm`.
     *
     *
     *
     * If the payment source type is bank account, you'll receive a status code 202, indicating
     * the need to submit the bank account information.
     * Easyship won't hold the details of your bank account. We use `setup intent` to attach
     * the bank account to your easyship account on Stripe.
     *
     * Note: A bank account payment source is only available for US companies.
     *
     * Example:
     * <details>
     *   <summary>Stripe Bank Account JS Example</summary>
     *   ```html
     *     <script>
     *       // Retrieve Easyship stripe publishable api key through `GET
     * /2024-09/account/stripe`
     *       const stripe = Stripe('stripe_publishable_api_key');
     *
     *       // Use the form that already exists on the web page.
     *       const paymentMethodForm = document.getElementById('payment-method-form');
     *
     *       paymentMethodForm.addEventListener('submit', (ev) => {
     *         ev.preventDefault();
     *         const accountHolderNameField = document.getElementById('account-holder-name');
     *         const emailField = document.getElementById('email-field');
     *
     *         // Retrieve the client secret from POST /2024-09/payment_sources.
     *         const clientSecretField = document.getElementById('client-secret-field');
     *
     *         // Calling this method will open the dialog to submit bank account information.
     *         stripe.collectBankAccountForSetup({
     *           clientSecret: clientSecretField.value,
     *           params: {
     *             payment_method_type: 'us_bank_account',
     *             payment_method_data: {
     *               billing_details: {
     *                 name: accountHolderNameField.value,
     *                 email: emailField.value,
     *               },
     *             },
     *           }
     *         })
     *         .then(({setupIntent, error}) => {
     *           if (error) {
     *             console.error(error.message);
     *           } else {
     *             // POST /2024-09/payment_sources/confirm to finalize the bank account
     * payment source at Easyship
     *           }
     *         });
     *       });
     *     </script>
     *   ```
     * <details>
     *
     * Once the bank account information has been submitted successfully, proceed with the next
     * step found in `POST /2024-09/payment_sources/confirm`.
     *
     *
     * Required authorization scope: `public.payment_source:write`
     *
     *
     * @summary Create a Payment Source
     * @throws FetchError<422, types.PaymentSourcesCreateResponse422> credit card has expired
     */
    payment_sources_create(body) {
        return this.core.fetch('/2024-09/payment_sources', 'post', body);
    }
    /**
     * Update a card payment source.
     *
     * Required authorization scope: `public.payment_source:write`
     *
     *
     * @summary Update a Payment Source
     * @throws FetchError<404, types.PaymentSourcesUpdateResponse404> No record found
     */
    payment_sources_update(body, metadata) {
        return this.core.fetch('/2024-09/payment_sources/{payment_source_id}', 'patch', body, metadata);
    }
    /**
     * Delete a card Payment Source
     *
     * Required authorization scope: `public.payment_source:write`
     *
     *
     * @summary Delete a Payment Source
     * @throws FetchError<422, types.PaymentSourcesDeleteResponse422> Unable to delete last credit card
     */
    payment_sources_delete(metadata) {
        return this.core.fetch('/2024-09/payment_sources/{payment_source_id}', 'delete', metadata);
    }
    /**
     * Cancel a pickup.
     *
     * Required authorization scope: `public.pickup:write`
     *
     *
     * @summary Cancel a Pickup
     * @throws FetchError<404, types.PickupsCancelResponse404> pickup not found
     * @throws FetchError<422, types.PickupsCancelResponse422> failed validations
     */
    pickups_cancel(metadata) {
        return this.core.fetch('/2024-09/pickups/{easyship_pickup_id}/cancel', 'post', metadata);
    }
    /**
     * Retrieve a list of pickups.
     *
     * Required authorization scope: `public.pickup:read`
     *
     *
     * @summary List all Pickups
     */
    pickups_index(metadata) {
        return this.core.fetch('/2024-09/pickups', 'get', metadata);
    }
    /**
     * Schedule a pickup.
     *
     * Required authorization scope: `public.pickup:write`
     *
     * > Only available if your courier provides pickup options.
     *
     * ## Select a pickup time
     *
     * After retrieving a courier's pickup slots, you can specify a pickup time in
     * `time_slot_id` or in `selected_from_time` and `selected_to_time`.
     *
     *
     * @summary Create a Pickup
     * @throws FetchError<422, types.PickupsCreateResponse422> slots not found for provided courier
     */
    pickups_create(body) {
        return this.core.fetch('/2024-09/pickups', 'post', body);
    }
    /**
     * Retrieve details of a specific pickup.
     *
     * Required authorization scope: `public.pickup:write`
     *
     *
     * @summary Get a Pickup
     * @throws FetchError<404, types.PickupsShowResponse404> record not found
     */
    pickups_show(metadata) {
        return this.core.fetch('/2024-09/pickups/{easyship_pickup_id}', 'get', metadata);
    }
    /**
     * Retrieve a list of products available with your account.
     *
     * Required authorization scope: `public.product:read`
     *
     *
     * @summary List all Products
     */
    products_index(metadata) {
        return this.core.fetch('/2024-09/products', 'get', metadata);
    }
    /**
     * Create a single product in your account.
     *
     * Required authorization scope: `public.product:write`
     *
     *
     * @summary Create a Product
     * @throws FetchError<422, types.ProductsCreateResponse422> failed validations
     */
    products_create(body) {
        return this.core.fetch('/2024-09/products', 'post', body);
    }
    /**
     * Delete a single product from your account.
     *
     * Required authorization scope: `public.product:write`
     *
     *
     * @summary Delete a Product
     * @throws FetchError<404, types.ProductsDeleteResponse404> record not found
     */
    products_delete(metadata) {
        return this.core.fetch('/2024-09/products/{product_id}', 'delete', metadata);
    }
    products_update(body, metadata) {
        return this.core.fetch('/2024-09/products/{product_id}', 'patch', body, metadata);
    }
    /**
     * Request a list of shipping quotes for a prospective shipment.
     *
     * Required authorization scope: `public.rate:read`
     *
     * > Compare couriers to see the cheapest, fastest and best value for money, or a
     * combination of speed, price and reliability.
     *
     * ## Input city and state
     *
     * If you are shipping to or within the United States, Canada, Mexico or Australia, we
     * recommend that you always input the origin and destination `city` and `state`. This
     * information is required by certain couriers to return accurate rates.
     *
     * ## Calculate dimensions and total weight
     *
     * You can calculate dimensions and total weight of your shipment in three ways:
     *
     * * Provide `total_actual_weight` and `box` objects for the shipment.
     * * Specify `actual_weight` and `dimensions` for each item of the `items` object: in this
     * case, total weight and box size will be calculated automatically.
     * * Specify `sku` for each item of the `items` object: in this case, actual weight and
     * dimensions for calculations will be taken as set for the product.
     *
     *
     * @summary Request Rates
     * @throws FetchError<402, types.RatesRequestResponse402> insufficient subscription tier for a specific feature
     * @throws FetchError<422, types.RatesRequestResponse422> failed validations
     */
    rates_request(body) {
        return this.core.fetch('/2024-09/rates', 'post', body);
    }
    /**
     * Cancel a shipment that has been shipped.
     *
     * Required authorization scope: `public.shipment:write`
     *
     * > You can cancel your shipment after it has been shipped only if its label failed to be
     * generated or if the label is already generated, but the shipment is not yet in transit.
     *
     *
     * @summary Cancel a Shipment
     * @throws FetchError<404, types.ShipmentsCancelResponse404> record not found
     * @throws FetchError<422, types.ShipmentsCancelResponse422> failed validations
     */
    shipments_cancel(metadata) {
        return this.core.fetch('/2024-09/shipments/{easyship_shipment_id}/cancel', 'post', metadata);
    }
    /**
     * Retrieve shipping documents of specific shipment.
     *
     * Required authorization scope: `public.shipment_document:read`
     *
     *
     * @summary List All Documents
     * @throws FetchError<400, types.ShipmentsDocumentsIndexResponse400> shipment has been cancelled
     * @throws FetchError<404, types.ShipmentsDocumentsIndexResponse404> record not found
     * @throws FetchError<422, types.ShipmentsDocumentsIndexResponse422> invalid document type
     */
    shipments_documents_index(metadata) {
        return this.core.fetch('/2024-09/shipments/{easyship_shipment_id}/documents', 'get', metadata);
    }
    return_shipments_create(body, metadata) {
        return this.core.fetch('/2024-09/shipments/{easyship_shipment_id}/return', 'post', body, metadata);
    }
    /**
     * Update the shipment tracking number and create tracking events.
     *
     * Required authorization scopes: `public.shipment:write`, `public.efulfillment:write`
     *
     * > This endpoint is only available to eFulfillment clients with shipments fulfilled at
     * one of Easyship's integrated warehouses.
     *
     * > You will need to specify `tracking_number` for initial request for a shipment. Further
     * updates of a shipment with the same `easyship_shipment_id` don't need to have the
     * `tracking number` unless you change it.
     *
     * For `events`, specify the `primary_status` field from the list:
     * * `InTransit`
     * * `OutForDelivery`
     * * `AttemptFail`
     * * `Delivered`
     * * `Exception`
     *
     * #### Example request for an initial setup of a shipment
     *
     * ```json
     * {
     *   "easyship_shipment_id": "ESHK10017799",
     *   "tracking_number": "ABCD1234",
     *   "events": [
     *     {
     *       "primary_status": "InTransit"
     *     }
     *   ]
     * }
     * ````
     *
     * #### Example request for a shipment status update
     *
     * This example has optional `event_time` and `event_time_zone`.
     *
     * ```json
     * {
     *   "easyship_shipment_id": "ESHK10017799",
     *   "events": [
     *     {
     *       "primary_status": "OutForDelivery",
     *       "event_time": "2020-04-29T03:38:00",
     *       "event_time_zone": "-04:00"
     *     }
     *   ]
     * }
     * ````
     *
     * #### Example request for a complete update
     *
     *
     * ```json
     * {
     *   "easyship_shipment_id": "ESHK10017799",
     *   "events": [
     *     {
     *       "primary_status": "OutForDelivery",
     *       "location": "Brooklyn, NY",
     *       "city": "Brooklyn",
     *       "country_alpha2": "US",
     *       "state": "NY",
     *       "zip": "11201",
     *       "handler": "UPS",
     *       "message": "On UPS vehicle for delivery",
     *       "event_time": "2020-04-29T03:38:00",
     *       "event_time_zone": "-04:00"
     *     }
     *   ]
     * }
     * ````
     *
     *
     * @summary Tracking Updates
     * @throws FetchError<404, types.EfulfillmentTrackingUpdateResponse404> shipment not found
     * @throws FetchError<422, types.EfulfillmentTrackingUpdateResponse422> failed validations
     */
    efulfillment_tracking_update(body) {
        return this.core.fetch('/2024-09/shipments/tracking_updates', 'post', body);
    }
    /**
     * Retrieve the most recent status for a shipment and a history of all previous
     * checkpoints.
     *
     * Required authorization scope: `public.track:read`
     *
     *
     * @summary List all Trackings
     */
    shipments_trackings_index(metadata) {
        return this.core.fetch('/2024-09/shipments/trackings', 'get', metadata);
    }
    /**
     * List transaction records for a shipment.
     *
     * Required authorization scope: `public.transaction_record:read`
     *
     *
     * @summary List Transaction Records for a Shipment
     * @throws FetchError<404, types.ShipmentsTransactionRecordsIndexResponse404> shipment not found
     */
    shipments_transaction_records_index(metadata) {
        return this.core.fetch('/2024-09/shipments/{easyship_shipment_id}/transaction_records', 'get', metadata);
    }
    /**
     * List unavailable couriers for a shipment.
     *
     * Required authorization scopes: `public.shipment:read`, `public.rate:read`
     *
     *
     * @summary List Unavailable Couriers for a Shipment
     * @throws FetchError<404, types.ShipmentUnavailableCouriersIndexResponse404> shipment not found
     */
    shipment_unavailable_couriers_index(metadata) {
        return this.core.fetch('/2024-09/shipments/{easyship_shipment_id}/unavailable_couriers', 'get', metadata);
    }
    /**
     * Update the warehouse state of one or multiple shipments.
     *
     * Required authorization scope: `public.shipment:write`, `public.efulfillment:write`
     *
     * > This endpoint is only available to eFulfillment clients with shipments fulfilled at
     * one of Easyship's integrated warehouses.
     *
     * > If a shipment contains the `metadata` object, it will persist unless you change
     * existing keys or create new ones: in this case, corresponding keys will be updated or
     * added.
     *
     * The `warehouse_state` field has the following possible statuses:
     * <table>
     *   <tr>
     *     <th>warehouse_state</th>
     *     <th>Description</th>
     *   </tr>
     *   <tr>
     *     <td>
     *       <code>created</code>
     *     </td>
     *     <td>
     *       An order has been created in the warehouse management system and is ready to be
     * fulfilled.<br><br><i>Note:</i> This update is not needed if a success response is sent
     * when Easyship sends the label callback.
     *     </td>
     *   </tr>
     *   <tr>
     *     <td>
     *       <code>failed</code>
     *     </td>
     *     <td>
     *       The order creation was rejected for an internal reason by the WMS. This can happen
     * if the order information doesn't meet the WMS' requirements, or a product SKU is not
     * defined in your WMS.<br><br>A message can be added using the message parameter. This
     * will allow the client and Easyship to understand the reason for rejection.
     *     </td>
     *   </tr>
     *   <tr>
     *     <td>
     *       <code>packed</code>
     *     </td>
     *     <td>
     *       The order has been processed and packed and is waiting to be handed over to the
     * courier
     *     </td>
     *   </tr>
     *   <tr>
     *     <td>
     *       <code>shipped</code>
     *     </td>
     *     <td>
     *       The order has been handed over to the courier and has left the
     * warehouse.<br><br><i>Note:</i> This status update will trigger the following:
     *       <ul>
     *         <li>If the shipment was created through a store integration, Easyship will mark
     * the order as "shipped" on the store</li>
     *         <li>If the company has the email notification option turned on, Easyship will
     * send an email notification to the receiver, with the tracking number and the tracking
     * page URL</li>
     *         <li>Easyship will start tracking the shipment, and update its status based on
     * the courier's tracking events</li>
     *       </ul>
     *     </td>
     *   </tr>
     *   <tr>
     *     <td>
     *       <code>cancellation_requested</code>
     *     </td>
     *     <td>
     *       A cancellation request has been sent to the warehouse management system. It is
     * awaiting confirmation by the warehouse.<br><br><i>Note:</i> This status is set by
     * clients requesting a cancellation through the dashboard. It should not be set by a
     * warehouse.
     *     </td>
     *   </tr>
     *   <tr>
     *     <td>
     *       <code>cancelled</code>
     *     </td>
     *     <td>
     *       The order has been cancelled in the warehouse management
     * system.<br><br><i>Note:</i> This status update will trigger Easyship to cancel the
     * shipment.
     *     </td>
     *   </tr>
     *   <tr>
     *     <td>
     *       <code>cancelled_no_stock</code>
     *     </td>
     *     <td>
     *      The order has been cancelled in the warehouse management system because the
     * products are out of stock.<br><br><i>Note:</i> This status update will trigger Easyship
     * to cancel the shipment.
     *     </td>
     *   </tr>
     *   <tr>
     *     <td>
     *       <code>backorder_no_stock</code>
     *     </td>
     *     <td>
     *       The order is set as backorder because of the products are out of stock. It may be
     * packed and shipped at a later date.
     *     </td>
     *   </tr>
     *   <tr>
     *     <td>
     *       <code>returned</code>
     *     </td>
     *     <td>
     *       The package was returned by the courier or by the receiver, and received at the
     * warehouse.
     *     </td>
     *   </tr>
     * </table>
     *
     *
     * @summary Warehouse State Updates
     * @throws FetchError<422, types.EfulfillmentWarehouseStateUpdateResponse422> failure
     */
    efulfillment_warehouse_state_update(body) {
        return this.core.fetch('/2024-09/shipments/warehouse_state_updates', 'post', body);
    }
    /**
     * Retrieve a list of shipments.
     *
     * Required authorization scope: `public.shipment:read`
     *
     *
     * @summary List all Shipments
     * @throws FetchError<422, types.ShipmentsIndexResponse422> invalid filter param
     */
    shipments_index(metadata) {
        return this.core.fetch('/2024-09/shipments', 'get', metadata);
    }
    /**
     * Create a new shipment.
     *
     * Required authorization scope: `public.shipment:write` and `public.label:write` if a
     * label is requested during the request.
     *
     * ## Select a courier
     *
     * If you use our Rates API, you can define a courier ID to assign a courier to the
     * shipment using `courier_service_id`. If you skip courier ID, we will return a list of
     * all possible rates to your new shipment and assign the best value for money courier.
     *
     * ## Calculate dimensions and total weight
     *
     * You can calculate dimensions and total weight of your shipment in three ways:
     *
     * * Provide `total_actual_weight` and `box` objects for the shipment.
     * * Specify `actual_weight` and `dimensions` for each item of the `items` object: in this
     * case, total weight and box size will be calculated automatically.
     * * Specify `sku` for each item of the `items` object: in this case, actual weight and
     * dimensions for calculations will be taken as set for the product.
     *
     *
     * @summary Create a Shipment
     * @throws FetchError<402, types.ShipmentsCreateResponse402> insufficient subscription tier for a specific feature
     * @throws FetchError<422, types.ShipmentsCreateResponse422> failed validations
     */
    shipments_create(body) {
        return this.core.fetch('/2024-09/shipments', 'post', body);
    }
    /**
     * Retrieve details of a specific shipment.
     *
     * Required authorization scope: `public.shipment:read`
     *
     * > All shipment documents are customisable. You can set:
     * >
     * > - Document format: URL, PDF or PNG
     * > - Label page size: A4, A5 or 4x6
     * > - Commercial invoice page size: A4 or 4x6
     * > - Packing slip page size: A4 or 4x6
     *
     *
     * @summary Get a Shipment
     * @throws FetchError<404, types.ShipmentsShowResponse404> record not found
     */
    shipments_show(metadata) {
        return this.core.fetch('/2024-09/shipments/{easyship_shipment_id}', 'get', metadata);
    }
    shipments_update(body, metadata) {
        return this.core.fetch('/2024-09/shipments/{easyship_shipment_id}', 'patch', body, metadata);
    }
    /**
     * Delete a shipment that has not yet been shipped.
     *
     * Required authorization scope: `public.shipment:write`
     *
     *
     * @summary Delete a Shipment
     * @throws FetchError<404, types.ShipmentsDeleteResponse404> shipment has been shipped
     */
    shipments_delete(metadata) {
        return this.core.fetch('/2024-09/shipments/{easyship_shipment_id}', 'delete', metadata);
    }
    /**
     * Retrieve a list of pickup's shipments.
     *
     * Required authorization scope: `public.shipment:read`
     *
     *
     * @summary List All Shipments of Specific Pickup
     */
    pickups_shipments_index(metadata) {
        return this.core.fetch('/2024-09/pickups/{pickup_id}/shipments', 'get', metadata);
    }
    shipping_rule_action_create(body, metadata) {
        return this.core.fetch('/2024-09/shipping_rules/{shipping_rule_id}/actions', 'post', body, metadata);
    }
    /**
     * List actions for a shipping rule.
     *
     * Required authorization scope: `public.shipping_rule:read`
     *
     *
     * @summary List all Actions for a Shipping Rule
     */
    shipping_rule_action_index(metadata) {
        return this.core.fetch('/2024-09/shipping_rules/{shipping_rule_id}/actions', 'get', metadata);
    }
    shipping_rule_action_update(body, metadata) {
        return this.core.fetch('/2024-09/shipping_rules/{shipping_rule_id}/actions/{action_id}', 'patch', body, metadata);
    }
    /**
     * Delete shipping rule action.
     *
     * Required authorization scope: `public.shipping_rule:write`
     *
     *
     * @summary Delete Action of a Shipping Rule
     * @throws FetchError<403, types.ShippingRuleActionDeleteResponse403> unauthorized
     * @throws FetchError<404, types.ShippingRuleActionDeleteResponse404> record not found
     */
    shipping_rule_action_delete(metadata) {
        return this.core.fetch('/2024-09/shipping_rules/{shipping_rule_id}/actions/{action_id}', 'delete', metadata);
    }
    /**
     * Activate specific shipping rule.
     *
     * Required authorization scope: `public.shipping_rule:write`
     *
     *
     * @summary Activate a Shipping Rule
     * @throws FetchError<403, types.ShippingRuleActivateResponse403> unauthorized
     * @throws FetchError<404, types.ShippingRuleActivateResponse404> record not found
     */
    shipping_rule_activate(metadata) {
        return this.core.fetch('/2024-09/shipping_rules/{id}/activate', 'post', metadata);
    }
    shipping_rule_condition_create(body, metadata) {
        return this.core.fetch('/2024-09/shipping_rules/{shipping_rule_id}/conditions', 'post', body, metadata);
    }
    /**
     * List conditions of a shipping rule.
     *
     * Required authorization scope: `public.shipping_rule:read`
     *
     *
     * @summary List all Conditions for a Shipping Rule
     */
    shipping_rule_condition_index(metadata) {
        return this.core.fetch('/2024-09/shipping_rules/{shipping_rule_id}/conditions', 'get', metadata);
    }
    shipping_rule_condition_update(body, metadata) {
        return this.core.fetch('/2024-09/shipping_rules/{shipping_rule_id}/conditions/{condition_id}', 'patch', body, metadata);
    }
    /**
     * Delete shipping rule condition.
     *
     * Required authorization scope: `public.shipping_rule:write`
     *
     *
     * @summary Delete Condition of a Shipping Rule
     * @throws FetchError<403, types.ShippingRuleConditionDeleteResponse403> unauthorized
     */
    shipping_rule_condition_delete(metadata) {
        return this.core.fetch('/2024-09/shipping_rules/{shipping_rule_id}/conditions/{condition_id}', 'delete', metadata);
    }
    /**
     * Deactivate specific shipping rule.
     *
     * Required authorization scope: `public.shipping_rule:write`
     *
     *
     * @summary Deactivate a Shipping Rule
     * @throws FetchError<403, types.ShippingRuleDeactivateResponse403> unauthorized
     */
    shipping_rule_deactivate(metadata) {
        return this.core.fetch('/2024-09/shipping_rules/{id}/deactivate', 'post', metadata);
    }
    /**
     * Retrieve a list of available platform names for shipping rules.
     *
     * Required authorization scope: `public.shipping_rule:write`
     *
     *
     * @summary List all Platform Names
     */
    shipping_rule_platforms_index(metadata) {
        return this.core.fetch('/2024-09/shipping_rules/platforms', 'get', metadata);
    }
    /**
     * Retrieve a list of shipping rules.
     *
     * Required authorization scope: `public.shipping_rule:read`
     *
     *
     * @summary List all Shipping Rules
     */
    shipping_rules_index() {
        return this.core.fetch('/2024-09/shipping_rules', 'get');
    }
    /**
     * Create a shipping rule.
     *
     * Required authorization scope: `public.shipping_rule:write`
     *
     *
     * @summary Create a Shipping Rule
     * @throws FetchError<422, types.ShippingRulesCreateResponse422> invalid content
     */
    shipping_rules_create(body) {
        return this.core.fetch('/2024-09/shipping_rules', 'post', body);
    }
    /**
     * Retrieve a shipping rule.
     *
     * Required authorization scope: `public.shipping_rule:read`
     *
     *
     * @summary Get a Shipping Rule
     * @throws FetchError<403, types.ShippingRulesShowResponse403> unauthorized
     * @throws FetchError<404, types.ShippingRulesShowResponse404> record not found
     */
    shipping_rules_show(metadata) {
        return this.core.fetch('/2024-09/shipping_rules/{shipping_rule_id}', 'get', metadata);
    }
    shipping_rules_update(body, metadata) {
        return this.core.fetch('/2024-09/shipping_rules/{shipping_rule_id}', 'patch', body, metadata);
    }
    /**
     * Delete a shipping rule.
     *
     * Required authorization scope: `public.shipping_rule:write`
     *
     *
     * @summary Delete a Shipping Rule
     * @throws FetchError<403, types.ShippingRulesDeleteResponse403> unauthorized
     */
    shipping_rules_delete(metadata) {
        return this.core.fetch('/2024-09/shipping_rules/{shipping_rule_id}', 'delete', metadata);
    }
    /**
     * Retrieve a list of states.
     *
     * Required authorization scope: `public.reference:read`
     *
     * This endpoint in only used for the United States, Canada, Australia and Mexico.
     *
     *
     * @summary List all States
     */
    states_index(metadata) {
        return this.core.fetch('/2024-09/states', 'get', metadata);
    }
    /**
     * Retrieve a list of stores available with your account.
     *
     * Required authorization scope: `public.store:read`
     *
     *
     * @summary List all Stores
     */
    stores_index(metadata) {
        return this.core.fetch('/2024-09/stores', 'get', metadata);
    }
    /**
     * Retrieve a list of tags.
     *
     * Required authorization scope: `public.tag:read`
     *
     * > You can filter your tags by keywords.
     *
     *
     * @summary List all Tags
     */
    tags_index(metadata) {
        return this.core.fetch('/2024-09/tags', 'get', metadata);
    }
    /**
     * Create a new tag.
     *
     * Required authorization scope: `public.tag:write`
     *
     *
     * @summary Create a Tag
     * @throws FetchError<422, types.TagsCreateResponse422> invalid content
     */
    tags_create(body, metadata) {
        return this.core.fetch('/2024-09/tags', 'post', body, metadata);
    }
    /**
     * Retrieve tax and duty costs information.
     *
     * Required authorization scope: `public.tax_and_duty:read`
     *
     *
     * @summary Calculate Tax and Duty
     * @throws FetchError<402, types.TaxesAndDutiesCalculateResponse402> when insufficient subscription tier for specific feature
     * @throws FetchError<422, types.TaxesAndDutiesCalculateResponse422> could not calculate tax and duty
     */
    taxes_and_duties_calculate(body) {
        return this.core.fetch('/2024-09/taxes_and_duties', 'post', body);
    }
    /**
     * List supported couriers.
     *
     * Required authorization scope: `public.track_3p:read`
     *
     *
     * @summary List of Supported Couriers
     */
    trackings_list_supported_couriers(metadata) {
        return this.core.fetch('/2024-09/trackings/supported_couriers', 'get', metadata);
    }
    /**
     * Retrieve a list of trackings available with your account.
     *
     * Required authorization scope: `public.track_3p:read`
     *
     * > This API requires an updated contract with Easyship. Get in touch with your account
     * manager or Easyship Support Team.
     *
     *
     * @summary List all Trackings
     */
    trackings_index(metadata) {
        return this.core.fetch('/2024-09/trackings', 'get', metadata);
    }
    /**
     * Create a single tracking in your account.
     *
     * Required authorization scope: `public.track_3p:write`
     *
     * > This API requires an updated contract with Easyship. Get in touch with your account
     * manager or Easyship Support Team.
     *
     *
     * @summary Create a Tracking
     * @throws FetchError<422, types.TrackingsCreateResponse422> failed validations
     */
    trackings_create(body) {
        return this.core.fetch('/2024-09/trackings', 'post', body);
    }
    /**
     * Delete a single tracking from your account.
     *
     * Required authorization scope: `public.track_3p:write`
     *
     * > This API requires an updated contract with Easyship. Get in touch with your account
     * manager or Easyship Support Team.
     *
     *
     * @summary Delete a Tracking
     * @throws FetchError<404, types.TrackingsDeleteResponse404> record not found
     */
    trackings_delete(metadata) {
        return this.core.fetch('/2024-09/trackings/{tracking_id}', 'delete', metadata);
    }
    /**
     * Show a single tracking in your account.
     *
     * Required authorization scope: `public.track_3p:read`
     *
     * > This API requires an updated contract with Easyship. Get in touch with your account
     * manager or Easyship Support Team.
     *
     *
     * @summary Get a Tracking
     * @throws FetchError<404, types.TrackingsShowResponse404> record not found
     */
    trackings_show(metadata) {
        return this.core.fetch('/2024-09/trackings/{tracking_id}', 'get', metadata);
    }
    /**
     * Retrieve a list of all transactions within range.
     * Pagination of this endpoint is not indexed.
     * `count` on the response body will always be `null`.
     *
     * Required authorization scope: `public.transaction_record:read`
     *
     *
     * @summary List all Transactions
     * @throws FetchError<422, types.TransactionsIndexResponse422> failed validations
     */
    transactions_index(metadata) {
        return this.core.fetch('/2024-09/transaction_records', 'get', metadata);
    }
    /**
     * Retrieve a list of all billing document's transactions.
     * Pagination of this endpoint is not indexed.
     * `count` on the response body will always be `null`.
     *
     * Required authorization scope: `public.transaction_record:read`
     *
     *
     * @summary List all Billing Document's Transaction Records
     */
    billing_documents_transactions_index(metadata) {
        return this.core.fetch('/2024-09/billing_documents/{id}/transaction_records', 'get', metadata);
    }
    /**
     * Activates a single webhook for your account.
     *
     * Required authorization scope: `public.Webhook`
     *
     *
     * @summary Activate a Webhook
     * @throws FetchError<400, types.WebhooksActivateResponse400> failed to activate webhook
     */
    webhooks_activate(metadata) {
        return this.core.fetch('/2024-09/webhooks/{webhook_id}/activate', 'post', metadata);
    }
    /**
     * Deactivates a single webhook for your account.
     *
     * Required authorization scope: `public.Webhook`
     *
     *
     * @summary Deactivate a Webhook
     * @throws FetchError<400, types.WebhooksDeactivateResponse400> failed to deactivate webhook
     */
    webhooks_deactivate(metadata) {
        return this.core.fetch('/2024-09/webhooks/{webhook_id}/deactivate', 'post', metadata);
    }
    webhooks_test(body, metadata) {
        return this.core.fetch('/2024-09/webhooks/{webhook_id}/test', 'post', body, metadata);
    }
    /**
     * Retrieve a list of webhooks available within your account.
     *
     * Required authorization scope: `public.webhook:read`
     *
     *
     * @summary List all Webhooks
     */
    webhooks_index(metadata) {
        return this.core.fetch('/2024-09/webhooks', 'get', metadata);
    }
    /**
     * Create a single webhook in your account.
     *
     * Required authorization scope: `public.webhook:write`
     *
     *
     * @summary Create a Webhook
     * @throws FetchError<422, types.WebhooksCreateResponse422> failed version validation
     */
    webhooks_create(body) {
        return this.core.fetch('/2024-09/webhooks', 'post', body);
    }
    /**
     * Show a single webhook in your account.
     *
     * Required authorization scope: `public.webhook:read`
     *
     *
     * @summary Get a Webhook
     */
    webhooks_show(metadata) {
        return this.core.fetch('/2024-09/webhooks/{webhook_id}', 'get', metadata);
    }
    /**
     * Delete a single webhook from your account.
     *
     * Required authorization scope: `public.webhook:write`
     *
     *
     * @summary Delete a Webhook
     * @throws FetchError<400, types.WebhooksDeleteResponse400> failed to destroy webhook
     */
    webhooks_delete(metadata) {
        return this.core.fetch('/2024-09/webhooks/{webhook_id}', 'delete', metadata);
    }
    webhooks_update(body, metadata) {
        return this.core.fetch('/2024-09/webhooks/{webhook_id}', 'patch', body, metadata);
    }
}
const createSDK = (() => { return new SDK(); })();
export default createSDK;
