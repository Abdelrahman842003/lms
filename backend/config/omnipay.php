<?php

return [
    'default_gateway' => env('OMNIPAY_GATEWAY', 'ManualTransfer'),
    
    'gateways' => [
        'ManualTransfer' => [
            'driver' => 'ManualTransfer',
            'options' => [
                'testMode' => env('OMNIPAY_TEST_MODE', false),
            ],
        ],
    ],
    
    // Payment receiving accounts (configurable by admin via settings)
    'payment_methods' => [
        'instapay' => [
            'enabled' => true,
            'label_ar' => 'إنستاباي',
            'label_en' => 'InstaPay',
            'icon' => 'instapay',
        ],
        'vodafone_cash' => [
            'enabled' => true,
            'label_ar' => 'فودافون كاش',
            'label_en' => 'Vodafone Cash',
            'icon' => 'vodafone',
        ],
    ],
    
    // Payment expiry
    'payment_expiry_hours' => env('PAYMENT_EXPIRY_HOURS', 48),
];
