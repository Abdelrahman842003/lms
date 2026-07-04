<?php

namespace App\Domains\Subscriptions\Gateways\ManualTransfer\Message;

use Omnipay\Common\Message\AbstractRequest;

class CompletePurchaseRequest extends AbstractRequest
{
    public function getData()
    {
        $this->validate('transactionReference');

        return [
            'transactionReference' => $this->getTransactionReference(),
        ];
    }

    public function sendData($data)
    {
        return $this->response = new CompletePurchaseResponse($this, $data);
    }
}
