<?php

namespace App\Domains\Subscriptions\Gateways\ManualTransfer;

use Omnipay\Common\AbstractGateway;
use App\Domains\Subscriptions\Gateways\ManualTransfer\Message\PurchaseRequest;
use App\Domains\Subscriptions\Gateways\ManualTransfer\Message\CompletePurchaseRequest;

class Gateway extends AbstractGateway
{
    public function getName()
    {
        return 'ManualTransfer';
    }

    public function getDefaultParameters()
    {
        return [
            'testMode' => false,
        ];
    }

    public function purchase(array $parameters = [])
    {
        return $this->createRequest(PurchaseRequest::class, $parameters);
    }

    public function completePurchase(array $parameters = [])
    {
        return $this->createRequest(CompletePurchaseRequest::class, $parameters);
    }
}
