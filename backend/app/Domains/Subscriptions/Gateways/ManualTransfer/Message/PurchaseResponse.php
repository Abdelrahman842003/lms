<?php

namespace App\Domains\Subscriptions\Gateways\ManualTransfer\Message;

use Omnipay\Common\Message\AbstractResponse;

class PurchaseResponse extends AbstractResponse
{
    public function isSuccessful()
    {
        return true;
    }

    public function getTransactionReference()
    {
        return 'MT-' . uniqid();
    }
}
