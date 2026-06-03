<?php

namespace App\Domains\Subscriptions\Gateways\ManualTransfer\Message;

use Omnipay\Common\Message\AbstractResponse;

class CompletePurchaseResponse extends AbstractResponse
{
    public function isSuccessful()
    {
        return true;
    }
}
